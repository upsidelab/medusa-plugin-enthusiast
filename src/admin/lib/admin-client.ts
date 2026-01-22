import {enthusiastAdminSdk} from "./sdk";
import {
  Conversation,
  CreateConversationPayload,
  CreateMessagePayload, FeedbackData, FileUploadResponse, FileUploadStatusResponse, Message,
  PaginatedResult, StreamStatusResponse, SupportedFileTypes,
  TaskHandle,
  TaskState
} from "../../modules/enthusiast/api/types/conversation";
import {Agent, AgentDetails} from "../../modules/enthusiast/api/types/agent";
import {EnthusiastDatasetType} from "./types";
import {ProvidersConfig, ProvidersConfigResponse} from "../../modules/enthusiast/api/types/config";
import {CreateDataSetPayload} from "../../modules/enthusiast/api/types/dataset";
import {getBackendUrl} from "./utils";

export class AdminEnthusiastConfigApiClient {
  async getAvailableProviders(): Promise<ProvidersConfig> {
    const response = await enthusiastAdminSdk.client.fetch(`/enthusiast/config`);
    const result = response as Partial<ProvidersConfigResponse & ProvidersConfig>;
    return {
      embeddingProviders: (result.embedding_providers ?? result.embeddingProviders ?? []) as string[],
      languageModelProviders: (result.language_model_providers ?? result.languageModelProviders ?? []) as string[]
    };
  }

  async getLanguageModelsForProvider(name: string): Promise<string[]> {
    const response = await enthusiastAdminSdk.client.fetch(`/enthusiast/config/language-model-providers/${name}`);
    return response as string[];
  }

  async getEmbeddingModelsForProvider(name: string): Promise<string[]> {
    const response = await enthusiastAdminSdk.client.fetch(`/enthusiast/config/embedding-providers/${name}`);
    return response as string[];
  }
}


export class AdminEnthusiastConversationsApiClient {
  async getConversations(dataSetId: number, agentId: number | undefined = undefined, page: number = 1): Promise<PaginatedResult<Conversation>> {
    let url = `/enthusiast/conversations?data_set_id=${dataSetId}&page=${page}`;
    if (agentId) {
      url += `&agent_id=${agentId}`;
    }
    const response = await enthusiastAdminSdk.client.fetch(url);
    return response as PaginatedResult<Conversation>;
  }

  async createConversation(agentId: number): Promise<number> {
    const requestBody: CreateConversationPayload = {
      agent_id: agentId
    };

    const response = await enthusiastAdminSdk.client.fetch(
      `/enthusiast/conversations`,
      {
        method: "POST",
        body: requestBody,
      }
    ) as { id: number };

    return response.id;
  }

  async sendMessage(conversationId: number, dataSetId: number, message: string, streaming: boolean, fileIds?: number[]): Promise<TaskHandle> {
    const requestBody: CreateMessagePayload = {
      "question_message": message,
      "data_set_id": dataSetId,
      streaming,
      file_ids: fileIds
    }

    const response = await enthusiastAdminSdk.client.fetch(
      `/enthusiast/conversations/${conversationId}`,
      {
        method: "POST",
        body: requestBody,
      }
    );

    return response as TaskHandle;
  }

  async getTaskStatus(taskHandle: TaskHandle): Promise<string> {
    const response = await enthusiastAdminSdk.client.fetch(
      `/enthusiast/task-status/${taskHandle.task_id}`
    );
    const { state } = response as TaskState;
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
      const response = await enthusiastAdminSdk.client.fetch(
        `/enthusiast/conversations/${conversation_id}`
      );

      return response as Conversation;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get conversation history: ${error.message}`);
      } else {
        throw new Error("Failed to get conversation history: An unknown error occurred.");
      }
    }
  }

  async updateMessageFeedback(messageId: number | null, feedbackData: FeedbackData): Promise<void> {
    await enthusiastAdminSdk.client.fetch(
      `/enthusiast/messages/${messageId}/feedback/`,
      {
        method: 'PATCH',
        body: feedbackData,
      }
    );
  }

  async getSupportedFileTypes(): Promise<SupportedFileTypes> {
    try {
      const response = await enthusiastAdminSdk.client.fetch(
        `/enthusiast/supported-file-types/`
      );

      return response as SupportedFileTypes;
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
    const url = `${getBackendUrl()}/enthusiast/conversations/${conversationId}/upload`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
    }

    return await response.json() as FileUploadResponse;
  }

  async getFileUploadStatus(taskId: string): Promise<FileUploadStatusResponse> {
    const response = await enthusiastAdminSdk.client.fetch(
      `/enthusiast/file-upload-status/${taskId}/`
    );

    return response as FileUploadStatusResponse;
  }
  async getStreamStatus(): Promise<StreamStatusResponse> {
    const response = await enthusiastAdminSdk.client.fetch("/enthusiast/conversations/stream-status");
    return response as StreamStatusResponse;
  }

}


export class AdminDataSetsApiClient {
  async getInternalDataSets(): Promise<EnthusiastDatasetType[]> {
    return await enthusiastAdminSdk.client.fetch(
      `/datasets`
    ) as EnthusiastDatasetType[];
  }
  async connectDatasets(datasetId: string): Promise<void> {
    return await enthusiastAdminSdk.client.fetch(
    `/datasets/${datasetId}/connect`,
      {
        method: 'POST',
      }
    );
  }
  async synchronizeDatasets(datasetId: string): Promise<void> {
    return await enthusiastAdminSdk.client.fetch(
      `/datasets/${datasetId}/synchronize`,
        {
          method: 'POST',
        }
    );
  }

  async setAsActive(datasetId: string): Promise<void> {
    return await enthusiastAdminSdk.client.fetch(
      `/datasets/${datasetId}/activate`,
        {
          method: 'POST',
        }
    );
  }
}

export class AdminEnthusiastDatasetsApiClient {
  async list(): Promise<unknown> {
    return await enthusiastAdminSdk.client.fetch(`/enthusiast/datasets`)
  }

  async create(payload: CreateDataSetPayload): Promise<EnthusiastDatasetType> {
    return await enthusiastAdminSdk.client.fetch(`/enthusiast/datasets`, {
      method: "POST",
      body: payload,
    })
  }
}


export class AdminEnthusiastAgentsApiClient {
    async getAgentById(agentId: number): Promise<AgentDetails> {
        const response = await enthusiastAdminSdk.client.fetch(
            `/enthusiast/agents/${agentId}`
        );
        
        return response as AgentDetails;
    }

    async getDatasetAgents(dataSetId: number): Promise<Agent[]> {
        return await enthusiastAdminSdk.client.fetch(
            `/enthusiast/datasets/${dataSetId}/agents`
        ) as Agent[];
    }
}

export class AdminApiClient {
  dataSets(): AdminDataSetsApiClient {
    return new AdminDataSetsApiClient();
  }

  enthusiastDatasets(): AdminEnthusiastDatasetsApiClient {
    return new AdminEnthusiastDatasetsApiClient()
  }

  conversations(): AdminEnthusiastConversationsApiClient {
    return new AdminEnthusiastConversationsApiClient();
  }

  agents(): AdminEnthusiastAgentsApiClient {
    return new AdminEnthusiastAgentsApiClient();
  }
  config(): AdminEnthusiastConfigApiClient {
    return new AdminEnthusiastConfigApiClient();
  }

  async getStatus(): Promise<{connected: boolean}> {
    return await enthusiastAdminSdk.client.fetch("/enthusiast/status") as {connected: boolean};
  }
}

export const adminApiClient = new AdminApiClient();

