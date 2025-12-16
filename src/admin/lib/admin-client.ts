import {adminSdk} from "./sdk";
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



export class ConfigApiClient {
  async getAvailableProviders(): Promise<ProvidersConfig> {
    const response = await adminSdk.client.fetch(`/enthusiast/config`);
    const result = response as ProvidersConfigResponse;
    return {
      embeddingProviders: result.embedding_providers,
      languageModelProviders: result.language_model_providers
    };
  }

  async getLanguageModelsForProvider(name: string): Promise<string[]> {
    const response = await adminSdk.client.fetch(`/enthusiast/config/language-model-providers/${name}`);
    return response as string[];
  }

  async getEmbeddingModelsForProvider(name: string): Promise<string[]> {
    const response = await adminSdk.client.fetch(`/enthusiast/config/embedding-providers/${name}`);
    return response as string[];
  }
}


export class AdminConversationsApiClient {
  async getConversations(dataSetId: number, page: number = 1): Promise<PaginatedResult<Conversation>> {
    const response = await adminSdk.client.fetch(
      `/enthusiast/conversations?data_set_id=${dataSetId}&page=${page}`
    );
    return response as PaginatedResult<Conversation>;
  }

  async createConversation(agentId: number): Promise<number> {
    const requestBody: CreateConversationPayload = {
      agent_id: agentId
    };

    const response = await adminSdk.client.fetch(
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

    const response = await adminSdk.client.fetch(
      `/enthusiast/conversations/${conversationId}`,
      {
        method: "POST",
        body: requestBody,
      }
    );

    return response as TaskHandle;
  }

  async getTaskStatus(taskHandle: TaskHandle): Promise<string> {
    const response = await adminSdk.client.fetch(
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
      const response = await adminSdk.client.fetch(
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
    await adminSdk.client.fetch(
      `/enthusiast/messages/${messageId}/feedback/`,
      {
        method: 'PATCH',
        body: feedbackData,
      }
    );
  }

  async getSupportedFileTypes(): Promise<SupportedFileTypes> {
    try {
      const response = await adminSdk.client.fetch(
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
    // todo
    const baseUrl = 'http://localhost:9000/admin';
    const url = `${baseUrl}/enthusiast/conversations/${conversationId}/upload`;

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
    const response = await adminSdk.client.fetch(
      `/enthusiast/file-upload-status/${taskId}/`
    );

    return response as FileUploadStatusResponse;
  }
  async getStreamStatus(): Promise<StreamStatusResponse> {
    const response = await adminSdk.client.fetch("/enthusiast/conversations/stream-status");
    return response as StreamStatusResponse;
  }

}


export class AdminDataSetsApiClient {
  async getInternalDataSets(): Promise<EnthusiastDatasetType[]> {
    return await  adminSdk.client.fetch(
      `/datasets`
    ) as EnthusiastDatasetType[];
  }
  async connectDatasets(datasetId: string): Promise<void> {
    return await adminSdk.client.fetch(
      `/datasets/${datasetId}/connect`,
        {
          method: 'POST',
        }
    );
  }
  async synchronizeDatasets(datasetId: string): Promise<void> {
    return await adminSdk.client.fetch(
      `/datasets/${datasetId}/synchronize`,
        {
          method: 'POST',
        }
    );
  }

  async setAsActive(datasetId: string): Promise<void> {
    return await adminSdk.client.fetch(
      `/datasets/${datasetId}/activate`,
        {
          method: 'POST',
        }
    );
  }
}


export class AdminAgentsApiClient {
    async getAgentById(agentId: number): Promise<AgentDetails> {
        const response = await adminSdk.client.fetch(
            `/enthusiast/agents/${agentId}`
        );
        
        return response as AgentDetails;
    }

    async getDatasetAgents(dataSetId: number): Promise<Agent[]> {
        return await adminSdk.client.fetch(
            `/enthusiast/datasets/${dataSetId}/agents`
        ) as Agent[];
    }
}

export class AdminApiClient {
  dataSets(): AdminDataSetsApiClient {
    return new AdminDataSetsApiClient();
  }

  conversations(): AdminConversationsApiClient {
    return new AdminConversationsApiClient();
  }

  agents(): AdminAgentsApiClient {
    return new AdminAgentsApiClient();
  }
  config(): ConfigApiClient {
    return new ConfigApiClient();
  }

  async getStatus(): Promise<{connected: boolean}> {
    return await adminSdk.client.fetch("/enthusiast/status") as {connected: boolean};
  }
}

export const adminApiClient = new AdminApiClient();

