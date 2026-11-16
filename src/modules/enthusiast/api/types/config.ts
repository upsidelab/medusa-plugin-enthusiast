export type ProvidersConfigResponse = {
  language_model_providers: string[];
  embedding_providers: string[];
};

export type ProvidersConfig = {
  languageModelProviders: string[];
  embeddingProviders: string[];
};

export type IntegrationType = {
  type: string;
  name: string;
  integration_type_name: string;
  syncable: boolean;
  supports_oauth: boolean;
  config_schema: unknown;
};
