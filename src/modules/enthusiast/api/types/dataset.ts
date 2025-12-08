export type DataSetResponse = {
  id: number;
  name: string;
  language_model_provider: string;
  language_model: string;
  embedding_provider: string;
  embedding_model: string;
  embedding_vector_dimensions: number;
  system_message: string;
}

export type CreateDataSetPayload = {
  name: string;
  language_model_provider: string;
  language_model: string;
  embedding_provider: string;
  embedding_model: string;
  embedding_vector_dimensions: number;
  system_message: string;
}
export type UpdateDataSetPayload = {
  id: number | undefined;
  name: string;
  language_model_provider: string;
  language_model: string;
  system_message: string;
}

export type ProductSourceResponse = {
  id: number;
  plugin_name: string;
  config: string;
  data_set_id: number;
}

export type ConfigureProductSourcePayload = ProductSourceResponse;

export type DocumentSourceResponse = {
  id: number;
  plugin_name: string;
  config: string;
  data_set_id: number;
}

export type ConfigureDocumentSourcePayload = DocumentSourceResponse;

export type DataSet = {
  id: number | undefined;
  name: string;
  languageModelProvider: string;
  languageModel: string;
  embeddingProvider: string;
  embeddingModel: string;
  embeddingVectorSize: number;
  systemMessage: string;
}

export type CatalogSource = {
  id: number;
  plugin_name: string;
  config: string;
  data_set_id: number;
  corrupted: boolean;
}

export type Document = {
  id: number;
  url: string;
  title: string;
  content: string;
  isIndexed: boolean;
}


export type User = {
  id: number;
  email: string;
  isActive: boolean;
  isStaff: boolean;
}