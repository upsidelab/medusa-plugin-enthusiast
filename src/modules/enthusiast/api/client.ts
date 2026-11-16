import { AgentDetails, Agent, Account } from "./types/agent";
import {
  Conversation,
  CreateConversationPayload,
  CreateMessagePayload,
  FeedbackData,
  FileUploadResponse,
  FileUploadStatusResponse,
  Message,
  MessagePushStatusResponse,
  PaginatedResult,
  SupportedFileTypes,
  TaskHandle,
} from "./types/conversation";
import {
  CreateDataSetPayload,
  DataSet,
  DataSetResponse,
  Integration,
  IntegrationSyncStatusResponse,
  SyncResponse,
} from "./types/dataset";
import {
  EmbeddingModelsConfig,
  EmbeddingModelsConfigResponse,
  IntegrationType,
  ProvidersConfig,
  ProvidersConfigResponse,
} from "./types/config";

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
  constructor(
    protected readonly apiBase: string,
    protected readonly apiToken: string
  ) {}

  _requestConfiguration(): RequestInit {
    return {
      headers: {
        Authorization: `Token ${this.apiToken}`,
        "Content-Type": "application/json",
      },
    };
  }

  async _extractErrorMessage(responseObj: Response): Promise<string> {
    let errorMessage: string;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const errorObj = await responseObj.json();
      if (!errorObj || typeof errorObj !== "object") {
        return "Unknown error";
      }
      const firstEntry = Object.entries(errorObj as { [s: string]: unknown })[0] as
        | [string, any]
        | undefined;

      if (!firstEntry) return "Unknown error";

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [key, value] = firstEntry;
      let message: string;

      if (Array.isArray(value)) {
        message = String(value[0]);
      } else if (typeof value === "string") {
        message = value;
      } else {
        message = JSON.stringify(value);
      }

      return `${key}: ${message}`;
    } catch {
      errorMessage = await responseObj.text();
    }
    return errorMessage;
  }

  async raiseForStatus(response: Response): Promise<Response> {
    if (!response.ok) {
      const errorMessage = await this._extractErrorMessage(response);
      throw new EnthusiastAPIError(response.status, response.statusText, errorMessage);
    }
    return response;
  }
  async sendRequest(path: string, init: RequestInit) {
    const response = await fetch(path, init);
    await this.raiseForStatus(response);
    return response;
  }
}

export class ConversationsApiClient extends BaseApiClient {
  async getConversations(
    dataSetId: number,
    agentId: number | undefined = undefined,
    page: number = 1
  ): Promise<PaginatedResult<Conversation>> {
    let url = `${this.apiBase}/api/conversations?data_set_id=${dataSetId}&page=${page}`;
    if (agentId) {
      url = url + `&agent_id=${agentId}`;
    }
    const response = await this.sendRequest(url, this._requestConfiguration());
    return (await response.json()) as Promise<PaginatedResult<Conversation>>;
  }

  async createConversation(agentId: number): Promise<number> {
    const requestBody: CreateConversationPayload = {
      agent_id: agentId,
    };

    const requestConfiguration = this._requestConfiguration();
    requestConfiguration.method = "POST";
    requestConfiguration.body = JSON.stringify(requestBody);

    const response = await this.sendRequest(
      `${this.apiBase}/api/conversations`,
      requestConfiguration
    );

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.statusText}`);
    }

    const { id } = (await response.json()) as { id: number };
    return id;
  }

  async sendMessage(
    conversationId: number,
    dataSetId: number,
    message: string,
    streaming: boolean,
    fileIds?: number[]
  ): Promise<TaskHandle> {
    const requestBody: CreateMessagePayload = {
      question_message: message,
      data_set_id: dataSetId,
      streaming,
      file_ids: fileIds,
    };

    const response = await this.sendRequest(`${this.apiBase}/api/conversations/${conversationId}`, {
      ...this._requestConfiguration(),
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to enqueue task: ${response.statusText}`);
    }

    return (await response.json()) as TaskHandle;
  }

  async getTaskStatus(taskHandle: TaskHandle): Promise<string> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/message-push-status/${taskHandle.task_id}/`,
      { ...this._requestConfiguration() }
    );
    const { status } = (await response.json()) as MessagePushStatusResponse;
    return status;
  }

  async fetchResponseMessage(
    conversationId: number,
    taskHandle: TaskHandle
  ): Promise<Message | null> {
    const taskStatus = await this.getTaskStatus(taskHandle);

    if (taskStatus === "SUCCESS" || taskStatus === "FAILURE") {
      const conversation = await this.getConversation(conversationId);
      return conversation.history![conversation.history!.length - 1];
    }

    return null;
  }

  async getConversation(conversation_id: number | null): Promise<Conversation> {
    try {
      const response = await this.sendRequest(
        `${this.apiBase}/api/conversations/${conversation_id}`,
        {
          ...this._requestConfiguration(),
        }
      );

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
      method: "PATCH",
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      throw new Error(`Could not update feedback for message ID ${messageId}`);
    }

    return (await response.json()) as Promise<void>;
  }

  async getSupportedFileTypes(): Promise<SupportedFileTypes> {
    try {
      const response = await this.sendRequest(`${this.apiBase}/api/supported-file-types/`, {
        ...this._requestConfiguration(),
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as SupportedFileTypes;
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
    formData.append("file", file);

    const requestConfig = this._requestConfiguration();
    const headers = { ...requestConfig.headers } as Record<string, string>;
    delete headers["Content-Type"];

    const response = await this.sendRequest(
      `${this.apiBase}/api/conversations/${conversationId}/upload/`,
      {
        ...requestConfig,
        method: "POST",
        headers,
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to start file upload: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as FileUploadResponse;
  }

  async getFileUploadStatus(taskId: string): Promise<FileUploadStatusResponse> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/file-upload-status/${taskId}/`,
      this._requestConfiguration()
    );

    if (!response.ok) {
      throw new Error("Failed to check upload status");
    }

    return (await response.json()) as FileUploadStatusResponse;
  }
}

export class DataSetsApiClient extends BaseApiClient {
  async getDataSets(): Promise<DataSet[]> {
    const dataSets: DataSet[] = [];
    for (let page = 1; ; page++) {
      const response = await this.sendRequest(
        `${this.apiBase}/api/data_sets?page=${page}`,
        this._requestConfiguration()
      );
      const body = (await response.json()) as { results: DataSet[]; next?: string | null };
      dataSets.push(...body.results);
      if (!body.next) return dataSets;
    }
  }

  async createDataSet(payload: CreateDataSetPayload): Promise<number> {
    const response = await this.sendRequest(`${this.apiBase}/api/data_sets`, {
      ...this._requestConfiguration(),
      body: JSON.stringify(payload),
      method: "POST",
    });

    const responseJson = (await response.json()) as DataSetResponse;
    return responseJson.id;
  }

  async listDataSetIntegrations(dataSetId: number): Promise<Integration[]> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/data_sets/${dataSetId}/integrations/`,
      this._requestConfiguration()
    );
    return (await response.json()) as Integration[];
  }

  async addDataSetIntegration(
    dataSetId: number,
    type: string,
    config: object
  ): Promise<Integration> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/data_sets/${dataSetId}/integrations/`,
      {
        ...this._requestConfiguration(),
        method: "POST",
        body: JSON.stringify({ type, config }),
      }
    );
    return (await response.json()) as Integration;
  }

  async updateDataSetIntegration(
    dataSetId: number,
    integrationId: number,
    config: object
  ): Promise<Integration> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/data_sets/${dataSetId}/integrations/${integrationId}/`,
      {
        ...this._requestConfiguration(),
        method: "PATCH",
        body: JSON.stringify({ config }),
      }
    );
    return (await response.json()) as Integration;
  }

  async syncDataSetIntegration(dataSetId: number, integrationId: number): Promise<SyncResponse> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/data_sets/${dataSetId}/integrations/${integrationId}/sync/`,
      {
        ...this._requestConfiguration(),
        method: "POST",
      }
    );
    return (await response.json()) as SyncResponse;
  }

  async getIntegrationSyncStatus(taskId: string): Promise<IntegrationSyncStatusResponse> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/integration-sync-status/${taskId}/`,
      this._requestConfiguration()
    );
    return (await response.json()) as IntegrationSyncStatusResponse;
  }

  async getDataSet(dataSetId: number): Promise<DataSet> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/data_sets/${dataSetId}`,
      this._requestConfiguration()
    );
    const data = (await response.json()) as DataSetResponse;

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

    return (await response.json()) as Agent[];
  }
  async getAgentById(agentId: number): Promise<AgentDetails> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/agents/${agentId}`,
      this._requestConfiguration()
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch agent: ${response.statusText}`);
    }
    return (await response.json()) as AgentDetails;
  }
}
export class AccountsApiClient extends BaseApiClient {
  async me(): Promise<Account> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/account`,
      this._requestConfiguration()
    );
    return (await response.json()) as Account;
  }

  async createWebSocketTicket(): Promise<string> {
    const response = await this.sendRequest(`${this.apiBase}/api/auth/ws_ticket`, {
      ...this._requestConfiguration(),
      method: "POST",
    });
    const { ticket } = (await response.json()) as { ticket: string };
    return ticket;
  }
}
export class ConfigApiClient extends BaseApiClient {
  async getAvailableProviders(): Promise<ProvidersConfig> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/config`,
      this._requestConfiguration()
    );
    const result = (await response.json()) as ProvidersConfigResponse;

    return {
      embeddingProviders: result.embedding_providers,
      languageModelProviders: result.language_model_providers,
    };
  }

  async getLanguageModelsForProvider(name: string): Promise<string[]> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/config/language_model_providers/${name}`,
      this._requestConfiguration()
    );
    return (await response.json()) as string[];
  }

  async getEmbeddingModelsForProvider(name: string): Promise<EmbeddingModelsConfig> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/config/embedding_providers/${name}`,
      this._requestConfiguration()
    );
    const result = (await response.json()) as EmbeddingModelsConfigResponse;
    return {
      models: result.models ?? [],
      vectorSizeConstraints: result.vector_size_constraints ?? {},
    };
  }

  async getIntegrationTypes(): Promise<IntegrationType[]> {
    const response = await this.sendRequest(
      `${this.apiBase}/api/integration-types/`,
      this._requestConfiguration()
    );
    return (await response.json()) as IntegrationType[];
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
