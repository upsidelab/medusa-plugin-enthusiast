import {InjectManager, InjectTransactionManager, MedusaContext, MedusaService, Modules} from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import {PluginOptions} from "../../settings";
import {ApiClient} from "./api/client";
import {
  Conversation,
  FeedbackData,
  FileUploadResponse,
  FileUploadStatusResponse,
  PaginatedResult,
  SupportedFileTypes,
  TaskHandle
} from "./api/types/conversation";
import {AgentDetails} from "./api/types/agent";
import EnthusiastDataset from "./models/enthusiast-dataset";
import {EnthusiastDatasetType} from "../../admin/lib/types";
import {ConfigModule} from "@medusajs/framework";
import {SyncStatus} from "./types";
import syncDatasetStatusWorkflow from "../../workflows/check-sync-status";
import {MedusaContainer} from "@medusajs/medusa";
import { Context } from "@medusajs/framework/types"
import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import {CreateDataSetPayload} from "../../modules/enthusiast/api/types/dataset";
import {WebsocketHandler} from "../../modules/enthusiast/websocket";

type InjectedDependencies = {
  logger: Logger
  configModule: ConfigModule
}


export default class EnthusiastService extends MedusaService({EnthusiastDataset}){
  protected options_: PluginOptions
  protected logger_: Logger
  protected configModule_: ConfigModule

  constructor({ logger, configModule }: InjectedDependencies, options: PluginOptions) {
    super(...arguments)

    this.options_ = options
    this.logger_ = logger
    this.configModule_ = configModule
  }
  apiClient = () => {
    return new ApiClient(this.options_.enthusiastApiUrl, this.options_.enthusiastServiceAccountToken)
  }

  isConnected = async () => {
    try {
      await this.apiClient().accounts().me();
      return {isConnected: true}
    } catch {
      return {isConnected: false}
    }
  }
  listAgents = async (dataSetId: number) => {
    return await this.apiClient().agents().getDatasetAvailableAgents(dataSetId)
  }

  listDatasets = async () => {
    return await this.apiClient().dataSets().getDataSets()
  }

  getAgentById = async (agentId: number): Promise<AgentDetails> => {
    return await this.apiClient().agents().getAgentById(agentId)
  }

  getConversations = async (dataSetId: number, page: number = 1): Promise<PaginatedResult<Conversation>> => {
    return await this.apiClient().conversations().getConversations(dataSetId, page)
  }

  conversationCreate = async (agentId: number): Promise<number> => {
    return await this.apiClient().conversations().createConversation(agentId)
  }

  getConversation = async (conversationId: number): Promise<Conversation> => {
    return await this.apiClient().conversations().getConversation(conversationId)
  }

  sendMessage = async (conversationId: number, dataSetId: number, message: string, streaming: boolean, fileIds?: number[]): Promise<TaskHandle> => {
    return await this.apiClient().conversations().sendMessage(conversationId, dataSetId, message, streaming, fileIds)
  }

  getTaskStatus = async (taskHandle: TaskHandle): Promise<string> => {
    return await this.apiClient().conversations().getTaskStatus(taskHandle)
  }

  fetchResponseMessage = async (conversationId: number, taskHandle: TaskHandle) => {
    return await this.apiClient().conversations().fetchResponseMessage(conversationId, taskHandle)
  }

  messageFeedbackUpdate = async (messageId: number, feedbackData: FeedbackData): Promise<void> => {
    return await this.apiClient().conversations().updateMessageFeedback(messageId, feedbackData)
  }

  getSupportedFileTypes = async (): Promise<SupportedFileTypes> => {
    return await this.apiClient().conversations().getSupportedFileTypes()
  }

uploadFile = async (conversationId: number, file: Express.Multer.File): Promise<FileUploadResponse> => {
    const fileObj = new File(
      [file.buffer],
      file.originalname,
      { type: file.mimetype }
    );
    return await this.apiClient().conversations().uploadFile(conversationId, fileObj)
  }

  getFileUploadStatus = async (taskId: string): Promise<FileUploadStatusResponse> => {
    return await this.apiClient().conversations().getFileUploadStatus(taskId)
  }

  listInternalDatasets = async (container: MedusaContainer): Promise<EnthusiastDatasetType[]> => {
    const enthusiastDatasets = await this.apiClient().dataSets().getDataSets()
    const enthusiastDatasetsIds = enthusiastDatasets.map(d => d.id)
    const internalDatasets = await this.listEnthusiastDatasets()
    const apiKeyModuleService = container.resolve(Modules.API_KEY)
    const notRelevantDatasets = await this.listEnthusiastDatasets({
      external_id: {$nin: enthusiastDatasetsIds}
    })
    const notRelevantApiKeyIds = notRelevantDatasets.map(dataset => dataset.api_key_id).filter((id): id is string => id != null)
    await apiKeyModuleService.deleteApiKeys(notRelevantApiKeyIds)
    await this.deleteEnthusiastDatasets({
      external_id: {
        $nin: enthusiastDatasetsIds
      },
    })
    const internalDatasetsMap = internalDatasets.reduce((acc, item) => {
      acc[item.external_id] = item;
      return acc;
    }, {} as Record<string, { id: string; external_id: number }>);
    // todo change names
    const upsert = enthusiastDatasets.reduce((acc, enthusiastDataset) => {
      const found = internalDatasetsMap[enthusiastDataset.id];
      if (found) {
        acc.update.push({
          id: found.id.toString(),
          external_id: enthusiastDataset.id,
          name: enthusiastDataset.name,
        });
      } else {
        acc.create.push({
          external_id: enthusiastDataset.id,
          name: enthusiastDataset.name,
        });
      }

      return acc;
    }, {create: [], update: []} as {create: {external_id: number, name: string}[], update: {id: string, external_id: number, name: string}[]});
    await this.createEnthusiastDatasets(upsert.create)
    await this.updateEnthusiastDatasets(upsert.update)
    return await this.listEnthusiastDatasets()

  }

  connectDatasets = async (datasetsId: string, container: MedusaContainer): Promise<void> => {
    const apiKeyModuleService = container.resolve(Modules.API_KEY)
    const datasets = await this.listEnthusiastDatasets({id: datasetsId, is_connected: false})
    if (!datasets || !datasets.length) {
      return
    }
    const dataset = datasets[0]
    const apiKey = await apiKeyModuleService.createApiKeys({
      title: `Enthusiast API Key dataset(${dataset.id})`,
      type: "secret",
      created_by: "enthusiast-plugin",
    })
    const plugin = await this.apiClient().dataSets().addDataSetProductSource(dataset.external_id, this.options_.enthusiastMedusaSourcePluginName, {api_key:apiKey.token ,base_url:"http://host.docker.internal:9000"})
    this.logger_.info(JSON.stringify(plugin))
    await this.updateEnthusiastDatasets({id:dataset.id, is_connected:true, plugin_id:plugin.id, task_id: plugin.task_id, sync_status: SyncStatus.PROCESSING, api_key_id: apiKey.id})
    await syncDatasetStatusWorkflow(container).run({input: {datasetId: dataset.id}})

  }
  synchronizeDatasets = async (datasetId: string, container: MedusaContainer): Promise<void> => {
    const datasets = await this.listEnthusiastDatasets({id: datasetId, is_connected: true, plugin_id:{$ne: null}})
    if (!datasets || !datasets.length) {
      return
    }
    const dataset = datasets[0]
    const { task_id } = await this.apiClient().dataSets().syncDataSetProductSource(dataset.external_id, dataset.plugin_id!)

    await this.updateEnthusiastDatasets({id:dataset.id, task_id: task_id, sync_status: SyncStatus.PROCESSING})
    await syncDatasetStatusWorkflow(container).run({input: {datasetId: dataset.id}})
  }

  datasetCreate = async(dataset: CreateDataSetPayload) => {
    return await this.apiClient().dataSets().createDataSet(dataset)
  }
  getConfig = async() => {
    return await this.apiClient().config().getAvailableProviders()
  }
  listLanguageModels = async(name: string) => {
    return await this.apiClient().config().getLanguageModelsForProvider(name)
  }
  listEmbeddingProviders = async(name: string) => {
    return await this.apiClient().config().getEmbeddingModelsForProvider(name)
  }
  buildWebsocketHandler = () => {
    if (this.options_.enthusiastWSUrl) {
      return new WebsocketHandler(this.options_.enthusiastWSUrl)
    }
    return
  }
  getStreamStatus = async () => {
    return {active: !!this.options_.enthusiastWSUrl}
  }

  @InjectTransactionManager()
  protected async activateDataset_(
    datasetId: string,
    container: MedusaContainer,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<void> {
    this.logger_.info(`DATASET_ID: ${datasetId}`)
    await this.updateEnthusiastDatasets({selector: {}, data: {is_active: false}}, sharedContext)
    await this.updateEnthusiastDatasets({id: datasetId, is_active:true}, sharedContext)
  }

  @InjectManager()
  async activateDataset(
    datasetId: string,
    container: MedusaContainer,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    this.logger_.info(`DATASET_ID: ${datasetId}`)
    return await this.activateDataset_(datasetId, container, sharedContext)
  }

}