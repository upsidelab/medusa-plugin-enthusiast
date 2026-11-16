import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaService,
  Modules,
} from "@medusajs/framework/utils";
import { Context, Logger } from "@medusajs/framework/types";
import { PluginOptions } from "../../settings";
import { ApiClient } from "./api/client";
import {
  Conversation,
  FeedbackData,
  FileUploadResponse,
  FileUploadStatusResponse,
  PaginatedResult,
  SupportedFileTypes,
  TaskHandle,
} from "./api/types/conversation";
import { AgentDetails } from "./api/types/agent";
import EnthusiastDataset from "./models/enthusiast-dataset";
import { EnthusiastDatasetType } from "../../admin/lib/types";
import { ConfigModule } from "@medusajs/framework";
import { SyncStatus } from "./types";
import syncDatasetStatusWorkflow from "../../workflows/check-sync-status";
import { MedusaContainer } from "@medusajs/medusa";
import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import {
  CreateDataSetPayload,
  IntegrationSyncStatusResponse,
} from "../../modules/enthusiast/api/types/dataset";
import { IntegrationType } from "../../modules/enthusiast/api/types/config";
import { WebsocketHandler } from "../../modules/enthusiast/websocket";
import { AuthenticatedMedusaRequest } from "@medusajs/framework/http";

type InjectedDependencies = {
  logger: Logger;
  configModule: ConfigModule;
  options: PluginOptions;
};

export class EnthusiastServiceError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export default class EnthusiastService extends MedusaService({ EnthusiastDataset }) {
  protected logger_: Logger;
  protected configModule_: ConfigModule;
  protected options_: PluginOptions;

  constructor({ logger, configModule, options }: InjectedDependencies) {
    super(...arguments);

    this.logger_ = logger;
    this.configModule_ = configModule;
    this.options_ = options;
  }
  apiClient = () => {
    return new ApiClient(
      this.options_.enthusiastApiUrl,
      this.options_.enthusiastServiceAccountToken
    );
  };

  /**
   * Verifies that the Enthusiast instance has an integration type matching
   * `enthusiastIntegrationType` (e.g. `medusa`) registered.
   */
  private resolveIntegrationType = async (): Promise<IntegrationType> => {
    const configured = this.options_.enthusiastIntegrationType ?? "medusa";
    const integrationTypes = await this.apiClient().config().getIntegrationTypes();
    const integrationType = integrationTypes.find((candidate) => candidate.type === configured);
    if (!integrationType) {
      throw new EnthusiastServiceError(
        `Integration type "${configured}" does not exist. ` +
          `Make sure it is registered in the Enthusiast instance's CATALOG_INTEGRATION_PLUGINS.`
      );
    }
    return integrationType;
  };

  isConnected = async () => {
    await this.apiClient().accounts().me();
    await this.resolveIntegrationType();
  };
  listAgents = async (dataSetId: number) => {
    return await this.apiClient().agents().getDatasetAvailableAgents(dataSetId);
  };

  listDatasets = async () => {
    return await this.apiClient().dataSets().getDataSets();
  };

  getAgentById = async (agentId: number): Promise<AgentDetails> => {
    return await this.apiClient().agents().getAgentById(agentId);
  };

  getConversations = async (
    dataSetId: number,
    agentId: number | undefined = undefined,
    page: number = 1
  ): Promise<PaginatedResult<Conversation>> => {
    return await this.apiClient().conversations().getConversations(dataSetId, agentId, page);
  };

  conversationCreate = async (agentId: number): Promise<number> => {
    return await this.apiClient().conversations().createConversation(agentId);
  };

  getConversation = async (conversationId: number): Promise<Conversation> => {
    return await this.apiClient().conversations().getConversation(conversationId);
  };

  sendMessage = async (
    conversationId: number,
    dataSetId: number,
    message: string,
    streaming: boolean,
    fileIds?: number[]
  ): Promise<TaskHandle> => {
    return await this.apiClient()
      .conversations()
      .sendMessage(conversationId, dataSetId, message, streaming, fileIds);
  };

  getTaskStatus = async (taskHandle: TaskHandle): Promise<string> => {
    return await this.apiClient().conversations().getTaskStatus(taskHandle);
  };

  getIntegrationSyncStatus = async (taskId: string): Promise<IntegrationSyncStatusResponse> => {
    return await this.apiClient().dataSets().getIntegrationSyncStatus(taskId);
  };

  fetchResponseMessage = async (conversationId: number, taskHandle: TaskHandle) => {
    return await this.apiClient().conversations().fetchResponseMessage(conversationId, taskHandle);
  };

  messageFeedbackUpdate = async (messageId: number, feedbackData: FeedbackData): Promise<void> => {
    return await this.apiClient().conversations().updateMessageFeedback(messageId, feedbackData);
  };

  getSupportedFileTypes = async (): Promise<SupportedFileTypes> => {
    return await this.apiClient().conversations().getSupportedFileTypes();
  };

  uploadFile = async (
    conversationId: number,
    file: Express.Multer.File
  ): Promise<FileUploadResponse> => {
    const fileObj = new File([file.buffer], file.originalname, { type: file.mimetype });
    return await this.apiClient().conversations().uploadFile(conversationId, fileObj);
  };

  getFileUploadStatus = async (taskId: string): Promise<FileUploadStatusResponse> => {
    return await this.apiClient().conversations().getFileUploadStatus(taskId);
  };

  listInternalDatasets = async (
    req: AuthenticatedMedusaRequest
  ): Promise<EnthusiastDatasetType[]> => {
    const container = req.scope;
    const apiKeyModuleService = container.resolve(Modules.API_KEY);
    const userModuleService = container.resolve(Modules.USER);
    const enthusiastDatasets = await this.apiClient().dataSets().getDataSets();
    const enthusiastDatasetsIds = enthusiastDatasets.map((d) => d.id);
    const internalDatasets = await this.listEnthusiastDatasets();

    const user = await userModuleService.retrieveUser(req.auth_context.actor_id);

    const notRelevantDatasets = await this.listEnthusiastDatasets({
      external_id: { $nin: enthusiastDatasetsIds },
    });
    const notRelevantApiKeyIds = notRelevantDatasets
      .map((dataset) => dataset.api_key_id)
      .filter((id): id is string => id != null);
    await apiKeyModuleService.revoke(
      {
        id: notRelevantApiKeyIds,
      },
      {
        revoked_by: user.email,
      }
    );
    await apiKeyModuleService.deleteApiKeys(notRelevantApiKeyIds);
    await this.deleteEnthusiastDatasets({
      external_id: {
        $nin: enthusiastDatasetsIds,
      },
    });
    const internalDatasetsMap = internalDatasets.reduce(
      (acc, item) => {
        acc[item.external_id] = item;
        return acc;
      },
      {} as Record<string, { id: string; external_id: number }>
    );
    const upsert = enthusiastDatasets.reduce(
      (acc, enthusiastDataset) => {
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
      },
      { create: [], update: [] } as {
        create: { external_id: number; name: string }[];
        update: { id: string; external_id: number; name: string }[];
      }
    );
    await this.createEnthusiastDatasets(upsert.create);
    await this.updateEnthusiastDatasets(upsert.update);
    return await this.listEnthusiastDatasets();
  };

  @InjectTransactionManager()
  protected async connectDatasets_(
    datasetId: string,
    container: MedusaContainer,
    @MedusaContext() _sharedContext?: Context<EntityManager>
  ): Promise<void> {
    const apiKeyModuleService = container.resolve(Modules.API_KEY);
    const datasets = await this.listEnthusiastDatasets({ id: datasetId, is_connected: false });
    if (!datasets || !datasets.length) {
      return;
    }
    const dataset = datasets[0];
    const apiKey = await apiKeyModuleService.createApiKeys({
      title: `Enthusiast API Key dataset(${dataset.id})`,
      type: "secret",
      created_by: "enthusiast-plugin",
    });

    const integrationType = await this.resolveIntegrationType();
    const integrationConfig = {
      api_key: apiKey.token,
      base_url: this.options_.medusaBackendUrl,
      admin_base_url: this.options_.medusaAdminUrl,
    };
    const dataSetsClient = this.apiClient().dataSets();
    const integrations = await dataSetsClient.listDataSetIntegrations(dataset.external_id);
    // Always reuse the integration this plugin created earlier (tracked via plugin_id). Adopting
    // another integration of the same type (and overwriting its config) requires an explicit opt-in.
    const existingIntegration =
      integrations.find((integration) => integration.id === dataset.plugin_id) ??
      (this.options_.overrideExistingIntegration
        ? integrations.find((integration) => integration.type === integrationType.type)
        : undefined);
    const integration = existingIntegration
      ? await dataSetsClient.updateDataSetIntegration(
          dataset.external_id,
          existingIntegration.id,
          integrationConfig
        )
      : await dataSetsClient.addDataSetIntegration(
          dataset.external_id,
          integrationType.type,
          integrationConfig
        );
    const { task_id } = await dataSetsClient.syncDataSetIntegration(
      dataset.external_id,
      integration.id
    );

    await this.updateEnthusiastDatasets({
      id: dataset.id,
      is_connected: true,
      plugin_id: integration.id,
      task_id,
      sync_status: SyncStatus.PROCESSING,
      api_key_id: apiKey.id,
    });
    if (dataset.api_key_id) {
      await this.revokeApiKeys_(container, [dataset.api_key_id]);
    }
    await syncDatasetStatusWorkflow(container).run({ input: { datasetId: dataset.id } });
  }

  private async revokeApiKeys_(container: MedusaContainer, apiKeyIds: string[]): Promise<void> {
    if (!apiKeyIds.length) return;
    const apiKeyModuleService = container.resolve(Modules.API_KEY);
    await apiKeyModuleService.revoke({ id: apiKeyIds }, { revoked_by: "enthusiast-plugin" });
    await apiKeyModuleService.deleteApiKeys(apiKeyIds);
  }

  @InjectManager()
  async connectDatasets(
    datasetId: string,
    container: MedusaContainer,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<void> {
    return await this.connectDatasets_(datasetId, container, sharedContext);
  }

  synchronizeDatasets = async (datasetId: string, container: MedusaContainer): Promise<void> => {
    if (await this.resetIfIntegrationMissing(datasetId)) {
      // connectDatasets recreates the integration and triggers the sync itself.
      await this.connectDatasets(datasetId, container);
      return;
    }
    const datasets = await this.listEnthusiastDatasets({
      id: datasetId,
      is_connected: true,
      plugin_id: { $ne: null },
    });
    if (!datasets || !datasets.length) {
      return;
    }
    const dataset = datasets[0];
    const { task_id } = await this.apiClient()
      .dataSets()
      .syncDataSetIntegration(dataset.external_id, dataset.plugin_id!);

    await this.updateEnthusiastDatasets({
      id: dataset.id,
      task_id: task_id,
      sync_status: SyncStatus.PROCESSING,
    });
    await syncDatasetStatusWorkflow(container).run({ input: { datasetId: dataset.id } });
  };

  checkDataset = async (datasetId: string): Promise<void> => {
    const dataset = await this.retrieveEnthusiastDataset(datasetId);
    if (!dataset.is_connected) {
      throw new EnthusiastServiceError(`Dataset not connected.`);
    }
    if (!dataset.plugin_id) {
      throw new EnthusiastServiceError(`Dataset has not plugin id assigned.`);
    }
    if (!dataset.api_key_id) {
      throw new EnthusiastServiceError(`Dataset has not api key id assigned.`);
    }
    await this.apiClient().dataSets().getDataSet(dataset.external_id);
  };

  private integrationExists = async (dataset: {
    external_id: number;
    plugin_id: number | null;
  }): Promise<boolean> => {
    if (!dataset.plugin_id) return false;
    const integrations = await this.apiClient()
      .dataSets()
      .listDataSetIntegrations(dataset.external_id);
    return integrations.some((integration) => integration.id === dataset.plugin_id);
  };

  /**
   * If the dataset is marked as connected but its integration was removed on the Enthusiast side
   * (e.g. after an upgrade), clears the connection state so it can be connected again.
   * Returns true when the state was reset.
   */
  private resetIfIntegrationMissing = async (datasetId: string): Promise<boolean> => {
    const dataset = await this.retrieveEnthusiastDataset(datasetId);
    if (!dataset.is_connected || (await this.integrationExists(dataset))) {
      return false;
    }
    await this.updateEnthusiastDatasets({
      id: dataset.id,
      is_connected: false,
      plugin_id: null,
      task_id: null,
      sync_status: null,
    });
    return true;
  };

  datasetCreate = async (dataset: CreateDataSetPayload) => {
    const externalId = await this.apiClient().dataSets().createDataSet(dataset);
    return await this.createEnthusiastDatasets({ name: dataset.name, external_id: externalId });
  };
  getConfig = async () => {
    return await this.apiClient().config().getAvailableProviders();
  };
  listLanguageModels = async (name: string) => {
    return await this.apiClient().config().getLanguageModelsForProvider(name);
  };
  listEmbeddingProviders = async (name: string) => {
    return await this.apiClient().config().getEmbeddingModelsForProvider(name);
  };
  buildWebsocketHandler = () => {
    if (this.options_.enthusiastWSUrl) {
      return new WebsocketHandler({
        wsBaseUrl: this.options_.enthusiastWSUrl,
        ticketProvider: () => this.apiClient().accounts().createWebSocketTicket(),
        origin: this.options_.medusaAdminUrl,
      });
    }
    return;
  };
  getStreamStatus = async () => {
    return { active: !!this.options_.enthusiastWSUrl };
  };

  @InjectTransactionManager()
  protected async activateDataset_(
    datasetId: string,
    container: MedusaContainer,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<void> {
    await this.updateEnthusiastDatasets(
      { selector: {}, data: { is_active: false } },
      sharedContext
    );
    await this.updateEnthusiastDatasets({ id: datasetId, is_active: true }, sharedContext);
  }

  @InjectManager()
  async activateDataset(
    datasetId: string,
    container: MedusaContainer,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<void> {
    const dataset = await this.retrieveEnthusiastDataset(datasetId);
    await this.resetIfIntegrationMissing(dataset.id);
    if (!(await this.retrieveEnthusiastDataset(datasetId)).is_connected) {
      await this.connectDatasets(datasetId, container);
    }
    await this.checkDataset(datasetId);
    return await this.activateDataset_(datasetId, container, sharedContext);
  }
}
