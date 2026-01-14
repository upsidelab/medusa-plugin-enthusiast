import {AgentDetails, Agent, Account} from "./types/agent";
import {
    Conversation,
    CreateConversationPayload,
    CreateMessagePayload, FeedbackData, FileUploadResponse, FileUploadStatusResponse, Message,
    PaginatedResult, SupportedFileTypes,
    TaskHandle,
    TaskState
} from "./types/conversation";
import {
  CatalogSource,
  ConfigureDocumentSourcePayload, ConfigureProductSourcePayload, CreateDataSetPayload,
  DataSet, DataSetResponse,
  DocumentSourceResponse,
  ProductSourceResponse, SyncResponse
} from "./types/dataset";
import {PluginsConfig, ProvidersConfig, ProvidersConfigResponse} from "./types/config";

export class EnthusiastAPIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: string
  ) {
    super(`HTTP ${status} ${statusText}`);
  }
}

export abstract class BaseApiClient {
  constructor(protected readonly apiBase: string, protected readonly apiToken: string) {}

  _requestConfiguration(): RequestInit {
    return {
      headers: {
        "Authorization": `Token ${this.apiToken}`,
        "Content-Type": "application/json"
      }
    }
  }

  async _extractErrorMessage(responseObj: Response): Promise<string> {
    let errorMessage: string;
    try {
      const errorObj = await responseObj.json();
      if (!errorObj || typeof errorObj !== "object") {
        return "Unknown error"
      }
      const firstEntry = Object.entries(errorObj)[0] as [string, any] | undefined

      if (!firstEntry) return "Unknown error"

      const [key, value] = firstEntry
      let message: string

      if (Array.isArray(value)) {
        message = String(value[0])
      } else if (typeof value === "string") {
        message = value
      } else {
        message = JSON.stringify(value)
      }

      return `${key}: ${message}`
    } catch {
        errorMessage = await responseObj.text();
      }
      return errorMessage
  }

  async raiseForStatus(response: Response): Promise<Response> {
    if (!response.ok) {
      const errorMessage = await this._extractErrorMessage(response)
      throw new EnthusiastAPIError(response.status, response.statusText, errorMessage);
    }
    return response
  }
  async sendRequest(path: string, init: RequestInit) {
    const response = await fetch(path, init)
    await this.raiseForStatus(response)
    return response
  }
}

export class ConversationsApiClient extends BaseApiClient {
  async getConversations(dataSetId: number, page: number = 1): Promise<PaginatedResult<Conversation>> {
    const response = await this.sendRequest(`${this.apiBase}/api/conversations?data_set_id=${dataSetId}&page=${page}`, this._requestConfiguration());
    return await response.json() as Promise<PaginatedResult<Conversation>>;
  }

  async createConversation(agentId: number): Promise<number> {
    const requestBody: CreateConversationPayload = {
      agent_id: agentId
    };

    const requestConfiguration = this._requestConfiguration();
    requestConfiguration.method = "POST";
    requestConfiguration.body = JSON.stringify(requestBody);

    const response = await this.sendRequest(`${this.apiBase}/api/conversations`, requestConfiguration);

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.statusText}`);
    }

    const { id } = await response.json();
    return id;
  }

  async sendMessage(conversationId: number, dataSetId: number, message: string, streaming: boolean, fileIds?: number[]): Promise<TaskHandle> {
    const requestBody: CreateMessagePayload = {
      "question_message": message,
      "data_set_id": dataSetId,
      streaming,
      file_ids: fileIds
    }

    const response = await this.sendRequest(`${this.apiBase}/api/conversations/${conversationId}`, {
      ...this._requestConfiguration(),
      method: "POST",
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Failed to enqueue task: ${response.statusText}`);
    }

    return await response.json() as TaskHandle;
  }

  async getTaskStatus(taskHandle: TaskHandle): Promise<string> {
    const response = await this.sendRequest(`${this.apiBase}/api/task_status/${taskHandle.task_id}`, {...this._requestConfiguration()});
    const { state } = await response.json() as TaskState;
    return state;
  }

  async fetchResponseMessage(conversationId: number, taskHandle: TaskHandle): Promise<Message | null> {
    const taskStatus = await this.getTaskStatus(taskHandle);

    if (taskStatus === "SUCCESS" || taskStatus === "FAILURE") {
      const conversation = await this.getConversation(conversationId);
      return conversation.history![conversation.history!.length - 1];
    }

    return null;
  }

  async getConversation(conversation_id: number | null): Promise<Conversation> {
    try {
      const response = await this.sendRequest(`${this.apiBase}/api/conversations/${conversation_id}`, {
        ...this._requestConfiguration()
      });

      if (!response.ok) {
        throw new Error(`Failed to get conversation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get conversation history: ${error.message}`);
      } else {
        throw new Error("Failed to get conversation history: An unknown error occurred.");
      }
    }
  }

  async updateMessageFeedback(messageId: number | null, feedbackData: FeedbackData): Promise<void> {
    const response = await this.sendRequest(`${this.apiBase}/api/messages/${messageId}/feedback/`, {
      ...this._requestConfiguration(),
      method: 'PATCH',
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      throw new Error(`Could not update feedback for message ID ${messageId}`);
    }

    return await response.json() as Promise<void>;
  }

  async getSupportedFileTypes(): Promise<SupportedFileTypes> {
    try {
      const response = await this.sendRequest(`${this.apiBase}/api/supported-file-types/`, {
        ...this._requestConfiguration(),
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json() as SupportedFileTypes;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get supported file types: ${error.message}`);
      } else {
        throw new Error("Failed to get supported file types: An unknown error occurred.");
      }
    }
  }

  async uploadFile(conversationId: number, file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const requestConfig = this._requestConfiguration();
    const headers = { ...requestConfig.headers } as Record<string, string>;
    delete headers['Content-Type'];

    const response = await this.sendRequest(`${this.apiBase}/api/conversations/${conversationId}/upload/`, {
      ...requestConfig,
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to start file upload: ${response.status} ${response.statusText}`);
    }

    return await response.json() as FileUploadResponse;
  }

  async getFileUploadStatus(taskId: string): Promise<FileUploadStatusResponse> {
    const response = await this.sendRequest(`${this.apiBase}/api/file-upload-status/${taskId}/`, this._requestConfiguration());

    if (!response.ok) {
      throw new Error('Failed to check upload status');
    }

    return await response.json() as FileUploadStatusResponse;
  }
}




export class DataSetsApiClient extends BaseApiClient {
  async getDataSets(): Promise<DataSet[]> {
    const response = await this.sendRequest(`${this.apiBase}/api/data_sets`, this._requestConfiguration());
    return (await response.json()).results as DataSet[];
  }

  async createDataSet(payload: CreateDataSetPayload): Promise<number> {
    const response = await this.sendRequest(`${this.apiBase}/api/data_sets`,
      {
        ...this._requestConfiguration(),
        body: JSON.stringify(payload),
        method: 'POST'
      }
    );

    const responseJson = (await response.json()) as DataSetResponse;
    return responseJson.id!;
  }

  async configureDataSetProductSource(productSource: CatalogSource): Promise<number> {
    const body: ConfigureProductSourcePayload = {
      id: productSource.id,
      plugin_name: productSource.plugin_name,
      config: JSON.parse(productSource.config),
      data_set_id: productSource.data_set_id
    }

    const response = await this.sendRequest(`${this.apiBase}/api/data_sets/${productSource.data_set_id}/product_sources/${productSource.id}`,
      {
        ...this._requestConfiguration(),
        body: JSON.stringify(body),
        method: 'PATCH'
      }
    );

    const responseJson = (await response.json()) as ProductSourceResponse;
    return responseJson.id!;
  }

  async getDataSetProductSource(dataSetId: number, productSourceId: number): Promise<CatalogSource> {
    const response = await this.sendRequest(`${this.apiBase}/api/data_sets/${dataSetId}/product_sources/${productSourceId}`, this._requestConfiguration());
    return await response.json() as CatalogSource;
  }

  async addDataSetProductSource(dataSetId: number, pluginName: string, config: object): Promise<CatalogSource> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/data_sets/${dataSetId}/product_sources`,
      {
        ...this._requestConfiguration(),
        method: "POST",
        body: JSON.stringify({plugin_name: pluginName, config: {configuration_args: config}})
      }
    );
    return await response.json() as CatalogSource
  }

  async syncDataSetProductSource(dataSetId: number, pluginId: number): Promise<SyncResponse> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/data_sets/${dataSetId}/product_sources/${pluginId}/sync`,
      {
        ...this._requestConfiguration(),
        method: "POST"
      }
    );
    return await response.json() as SyncResponse;
  }

  async configureDataSetDocumentSource(documentSource: CatalogSource): Promise<number> {
    const body: ConfigureDocumentSourcePayload = {
      id: documentSource.id,
      plugin_name: documentSource.plugin_name,
      config: JSON.parse(documentSource.config),
      data_set_id: documentSource.data_set_id
    }

    const response = await this.sendRequest(`${this.apiBase}/api/data_sets/${documentSource.data_set_id}/document_sources/${documentSource.id}`,
      {
        ...this._requestConfiguration(),
        body: JSON.stringify(body),
        method: 'PATCH'
      }
    );

    const responseJson = (await response.json()) as DocumentSourceResponse;
    return responseJson.id!;
  }

  async getDataSetDocumentSource(dataSetId: number, documentSourceId: number): Promise<CatalogSource> {
    const response = await this.sendRequest(`${this.apiBase}/api/data_sets/${dataSetId}/document_sources/${documentSourceId}`, this._requestConfiguration());
    return await response.json() as CatalogSource;
  }

  async addDataSetDocumentSource(dataSetId: number, pluginName: string, config: object): Promise<void> {
    await this.sendRequest(
      `${this.apiBase}/api/data_sets/${dataSetId}/document_sources`,
      {
        ...this._requestConfiguration(),
        method: "POST",
        body: JSON.stringify({plugin_name: pluginName, config: config})
      }
    );
  }

  async syncDataSetDocumentSource(dataSetId: number, pluginId: number): Promise<void> {
    await this.sendRequest(
      `${this.apiBase}/api/data_sets/${dataSetId}/document_sources/${pluginId}/sync`,
      {
        ...this._requestConfiguration(),
        method: "POST"
      }
    );
  }

  async removeDataSetDocumentSource(dataSetId: number, pluginId: number): Promise<void> {
    await this.sendRequest(
      `${this.apiBase}/api/data_sets/${dataSetId}/document_sources/${pluginId}`,
      {
        ...this._requestConfiguration(),
        method: "DELETE"
      }
    );
  }

  async getDataSet(dataSetId: number): Promise<DataSet> {
    const response = await this.sendRequest(`${this.apiBase}/api/data_sets/${dataSetId}`, this._requestConfiguration());
    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      languageModelProvider: data.language_model_provider,
      languageModel: data.language_model,
      embeddingProvider: data.embedding_provider,
      embeddingModel: data.embedding_model,
      embeddingVectorSize: data.embedding_vector_dimensions,
    } as DataSet;
  }
}


export class AgentsApiClient extends BaseApiClient {
    async getDatasetAvailableAgents(dataSetId: number): Promise<Agent[]> {
        const query = new URLSearchParams({ dataset: dataSetId.toString() });
        const response = await this.sendRequest(
            `${this.apiBase}/api/agents?${query.toString()}`,
            this._requestConfiguration()
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch available agents: ${response.statusText}`);
        }

        return await response.json() as Agent[];
    }
    async getAgentById(agentId: number): Promise<AgentDetails> {
        const response = await this.sendRequest(`${this.apiBase}/api/agents/${agentId}`, this._requestConfiguration());
        if (!response.ok) {
            throw new Error(`Failed to fetch agent: ${response.statusText}`);
        }
        return await response.json() as AgentDetails;
    }
}
 export class AccountsApiClient extends BaseApiClient {
  async me(): Promise<Account> {
    const response = await this.sendRequest(`${this.apiBase}/api/account`, this._requestConfiguration());
    return await response.json() as Account;
  }
 }
 export class ConfigApiClient extends BaseApiClient {
  async getAvailableProviders(): Promise<ProvidersConfig> {
    const response = await this.sendRequest(`${this.apiBase}/api/config`, this._requestConfiguration());
    const result = await response.json() as ProvidersConfigResponse;

    return {
      embeddingProviders: result.embedding_providers,
      languageModelProviders: result.language_model_providers
    };
  }

  async getLanguageModelsForProvider(name: string): Promise<string[]> {
    const response = await this.sendRequest(`${this.apiBase}/api/config/language_model_providers/${name}`, this._requestConfiguration());
    return await response.json() as string[];
  }

  async getEmbeddingModelsForProvider(name: string): Promise<string[]> {
    const response = await this.sendRequest(`${this.apiBase}/api/config/embedding_providers/${name}`, this._requestConfiguration());
    return await response.json() as string[];
  }

  async getAvailableProductSources(): Promise<PluginsConfig> {
    const response = await this.sendRequest(`${this.apiBase}/api/plugins/product_source_plugins?page_size=100`, this._requestConfiguration());
    return await response.json() as PluginsConfig;
  }
}


export class ApiClient {
  private readonly apiBase: string;
  private readonly apiToken: string;

  constructor(apiBase: string, apiToken: string) {
    this.apiBase = apiBase;
    this.apiToken = apiToken;
  }

  dataSets(): DataSetsApiClient {
    return new DataSetsApiClient(this.apiBase, this.apiToken);
  }

  conversations(): ConversationsApiClient {
    return new ConversationsApiClient(this.apiBase, this.apiToken);
  }

  agents(): AgentsApiClient {
    return new AgentsApiClient(this.apiBase, this.apiToken);
  }

  accounts(): AccountsApiClient {
    return new AccountsApiClient(this.apiBase, this.apiToken);
  }

  config(): ConfigApiClient {
    return new ConfigApiClient(this.apiBase, this.apiToken);
  }
}
