export type DataSetResponse = {
  id: number;
  name: string;
  language_model_provider: string;
  language_model: string;
  embedding_provider: string;
  embedding_model: string;
  embedding_vector_dimensions: number;
};

export type CreateDataSetPayload = {
  name: string;
  language_model_provider: string;
  language_model: string;
  embedding_provider: string;
  embedding_model: string;
  embedding_vector_dimensions: number;
  preconfigure_agents: boolean;
};
export type UpdateDataSetPayload = {
  id: number | undefined;
  name: string;
  language_model_provider: string;
  language_model: string;
};

export type DataSet = {
  id: number;
  name: string;
  languageModelProvider: string;
  languageModel: string;
  embeddingProvider: string;
  embeddingModel: string;
  embeddingVectorSize: number;
};

export type Integration = {
  id: number;
  dataset: number;
  type: string;
  name: string;
  config: Record<string, unknown>;
};

export type SyncResponse = {
  task_id: string;
};

export type IntegrationSyncStatusResponse = {
  task_id: string;
  status: string;
  result?: {
    integration_id?: number;
    data_set_id?: number;
    synced?: boolean;
    error?: string;
  };
};
