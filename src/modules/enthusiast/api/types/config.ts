export type ProvidersConfigResponse = {
  language_model_providers: string[];
  embedding_providers: string[];
};

export type ProvidersConfig = {
  languageModelProviders: string[];
  embeddingProviders: string[];
};

export type EmbeddingModelsConfigResponse = {
  models: string[];
  vector_size_constraints: Record<string, number[]>;
};

export type EmbeddingModelsConfig = {
  models: string[];
  vectorSizeConstraints: Record<string, number[]>;
};

export type IntegrationType = {
  type: string;
  name: string;
  integration_type_name: string;
  syncable: boolean;
  supports_oauth: boolean;
  config_schema: unknown;
};
