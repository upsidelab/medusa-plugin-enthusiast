import {InjectManager, InjectTransactionManager, MedusaContext, MedusaService, Modules} from "@medusajs/framework/utils"
import {Context, Logger} from "@medusajs/framework/types"
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
import {ConfigModule, container} from "@medusajs/framework";
import {SyncStatus} from "./types";
import syncDatasetStatusWorkflow from "../../workflows/check-sync-status";
import {MedusaContainer} from "@medusajs/medusa";
import {EntityManager} from "@medusajs/framework/mikro-orm/knex"
import {CreateDataSetPayload} from "../../modules/enthusiast/api/types/dataset";
import {WebsocketHandler} from "../../modules/enthusiast/websocket";
import {AuthenticatedMedusaRequest} from "@medusajs/framework/http";

type InjectedDependencies = {
  logger: Logger
  configModule: ConfigModule
  options: PluginOptions
}

export class EnthusiastServiceError extends Error {
  constructor(
    public message: string
  ) {
    super(message);
  }
}


export default class EnthusiastService extends MedusaService({EnthusiastDataset}){
  protected logger_: Logger
  protected configModule_: ConfigModule
  protected options_: PluginOptions

  constructor({ logger, configModule, options }: InjectedDependencies) {
    super(...arguments)

    this.logger_ = logger
    this.configModule_ = configModule
    this.options_ = options
  }
  apiClient = () => {
    return new ApiClient(this.options_.enthusiastApiUrl, this.options_.enthusiastServiceAccountToken)
  }

  isConnected = async () => {
    await this.apiClient().accounts().me();
    const availablePlugins = await this.apiClient().config().getAvailableIntegrations()
    const integrationExists = availablePlugins.choices.some(plugin => plugin.name === this.options_.enthusiastMedusaIntegrationName)
    if (!integrationExists) {
      throw new EnthusiastServiceError(`Integration ${this.options_.enthusiastMedusaIntegrationName} does not exist.`)
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

  getConversations = async (dataSetId: number, agentId: number | undefined = undefined, page: number = 1): Promise<PaginatedResult<Conversation>> => {
    return await this.apiClient().conversations().getConversations(dataSetId, agentId, page)
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

  listInternalDatasets = async (req: AuthenticatedMedusaRequest): Promise<EnthusiastDatasetType[]> => {
    const container = req.scope
    const apiKeyModuleService = container.resolve(Modules.API_KEY)
    const userModuleService = container.resolve(Modules.USER)
    const enthusiastDatasets = await this.apiClient().dataSets().getDataSets()
    const enthusiastDatasetsIds = enthusiastDatasets.map(d => d.id)
    const internalDatasets = await this.listEnthusiastDatasets()


    const user = await userModuleService.retrieveUser(
      req.auth_context.actor_id
    )

    const notRelevantDatasets = await this.listEnthusiastDatasets({
      external_id: {$nin: enthusiastDatasetsIds}
    })
    const notRelevantApiKeyIds = notRelevantDatasets.map(dataset => dataset.api_key_id).filter((id): id is string => id != null)
    await apiKeyModuleService.revoke(
      {
        id: notRelevantApiKeyIds,
      },
      {
        revoked_by: user.email,
      }
    )
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

    @InjectTransactionManager()
  protected async connectDatasets_(
    datasetId: string,
    container: MedusaContainer,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<void> {
    const apiKeyModuleService = container.resolve(Modules.API_KEY)
    const datasets = await this.listEnthusiastDatasets({id: datasetId, is_connected: false})
    if (!datasets || !datasets.length) {
      return
    }
    const dataset = datasets[0]
    const apiKey = await apiKeyModuleService.createApiKeys({
      title: `Enthusiast API Key dataset(${dataset.id})`,
      type: "secret",
      created_by: "enthusiast-plugin",
    })

    const plugin = await this.apiClient().dataSets().addDataSetIntegration(dataset.external_id, this.options_.enthusiastMedusaIntegrationName, {api_key:apiKey.token ,base_url: this.options_.medusaBackendUrl, admin_base_url: this.options_.medusaAdminUrl})
    await this.updateEnthusiastDatasets({id:dataset.id, is_connected:true, plugin_id:plugin.id, task_id: plugin.task_id, sync_status: SyncStatus.PROCESSING, api_key_id: apiKey.id})
    await syncDatasetStatusWorkflow(container).run({input: {datasetId: dataset.id}})
  }

  @InjectManager()
  async connectDatasets(
    datasetId: string,
    container: MedusaContainer,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<void> {
    return await this.connectDatasets_(datasetId, container, sharedContext)
  }


  synchronizeDatasets = async (datasetId: string, container: MedusaContainer): Promise<void> => {
    const datasets = await this.listEnthusiastDatasets({id: datasetId, is_connected: true, plugin_id:{$ne: null}})
    if (!datasets || !datasets.length) {
      return
    }
    const dataset = datasets[0]
    const { task_id } = await this.apiClient().dataSets().syncDataSetIntegration(dataset.external_id)

    await this.updateEnthusiastDatasets({id:dataset.id, task_id: task_id, sync_status: SyncStatus.PROCESSING})
    await syncDatasetStatusWorkflow(container).run({input: {datasetId: dataset.id}})
  }

  checkDataset = async(datasetId: string): Promise<void> => {
    const dataset = await this.retrieveEnthusiastDataset(datasetId)
    if (!dataset.is_connected) {
      throw new EnthusiastServiceError(`Dataset not connected.`)
    }
    if (!dataset.plugin_id) {
      throw new EnthusiastServiceError(`Dataset has not plugin id assigned.`)
    }
    if (!dataset.api_key_id) {
      throw new EnthusiastServiceError(`Dataset has not api key id assigned.`)
    }
    await this.apiClient().dataSets().getDataSet(dataset.external_id)
  }

  datasetCreate = async(dataset: CreateDataSetPayload) => {
    const externalId = await this.apiClient().dataSets().createDataSet(dataset)
    return await this.createEnthusiastDatasets({name: dataset.name, external_id: externalId})

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
    await this.updateEnthusiastDatasets({selector: {}, data: {is_active: false}}, sharedContext)
    await this.updateEnthusiastDatasets({id: datasetId, is_active:true}, sharedContext)
  }

  @InjectManager()
  async activateDataset(
    datasetId: string,
    container: MedusaContainer,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<void> {
    const dataset = await this.retrieveEnthusiastDataset(datasetId)
    if (!dataset.is_connected) {
      await this.connectDatasets(datasetId, container)
    }
    await this.checkDataset(datasetId)
    return await this.activateDataset_(datasetId, container, sharedContext)
  }

}