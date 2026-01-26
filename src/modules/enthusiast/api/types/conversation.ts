import { Agent } from "./agent";

export interface PaginatedResult<T> {
  results: T[];
  count: number;
}

export type FeedbackData = {
  rating: number | null;
  feedback: string;
};

export type TaskHandle = {
  task_id: string;
  streaming: boolean;
};

export type Message = {
  id: number;
  type: string;
  text: string;
};

export type Conversation = {
  id: number;
  started_at: Date;
  model: string;
  dimensions: number;
  data_set: string;
  summary?: string;
  agent: Agent;
  history?: Message[];
};

export type CreateConversationPayload = {
  agent_id: number;
};

export type CreateMessagePayload = {
  question_message: string;
  data_set_id: number;
  streaming: boolean;
  file_ids?: number[];
};

export type SupportedFileTypes = {
  supported_extensions: string[];
};

export type FileUploadResponse = {
  task_id: string;
};

export type FileUploadStatusResponse = {
  task_id: string;
  status: string;
  result?: {
    file_id?: number;
    error?: string;
  };
};

export type StreamStatusResponse = {
  active: boolean;
};

export type TaskState = {
  state: string;
};
