export type Agent = {
  id: number;
  name: string;
  description?: string;
  agent_type: string;
  agent_type_name?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  corrupted: boolean;
  dataset: number;
};

export type Account = {
  id: number;
  email: string;
  is_admin: boolean;
  permissions: string[];
};

export type TypeInfo = {
  container: string | null;
  inner_type?: string;
  key_type?: string;
  value_type?: string;
  nullable?: boolean;
};

export type ExtraArgDetail = {
  type: TypeInfo;
  description?: string | null;
  title?: string | null;
};

export type AgentConfig = {
  agent_args?: Record<string, unknown>;
  prompt_input?: Record<string, unknown>;
  tools?: Record<string, Record<string, unknown>>;
};

export type AgentDetails = {
  id: number;
  name: string;
  description: string;
  file_upload: boolean;
  config: AgentConfig;
  dataset: number;
  agent_type: string;
  created_at: string;
  updated_at: string;
};
