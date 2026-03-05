export type FileMessageProps = {
  id: number | null;
  type: "file";
  file_name: string;
  file_type: string;
};

export type MessageProps =
  | {
      type: "human" | "ai" | "system";
      text: string;
      id: number | null;
    }
  | FileMessageProps;
