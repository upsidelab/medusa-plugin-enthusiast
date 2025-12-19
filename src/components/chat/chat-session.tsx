import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PlusIcon } from "lucide-react";

import { MessageBubble } from "./message-bubble";
import { AttachmentBubble } from "./attachment-bubble";
import { MessageError } from "./message-error";
import { MessageBubbleTyping } from "./message-bubble-typing";
import {ChatWindow} from "./chat-window";
import { adminApiClient } from "../../admin/lib/admin-client";
import { adminSdk } from "../../admin/lib/sdk";
import {AgentDetails} from "../../modules/enthusiast/api/types/agent";
import {TaskHandle, Conversation as ConversationSchema} from "../../modules/enthusiast/api/types/conversation";

import {PageHeading} from "../utils/page-heading";
import {Button} from "../ui/button";
import {PageMain} from "../utils/page-main";
import {MessageFile, Message} from "../../components/chat/message-composer";

export type FileMessageProps = {
  id: number | null;
  type: "file";
  file_name: string;
  file_type: string;
};

export type MessageProps = {
  type: "human" | "ai" | "system";
  text: string;
  id: number | null;
} | FileMessageProps;

interface ChatSessionProps {
  pendingMessage?: Message;
}

export function ChatSession({ pendingMessage }: ChatSessionProps) {
  const { dataSetId: dataset, chatId } = useParams();
  const dataSetId = parseInt(dataset as string, 10);
  const conversationId = parseInt(chatId as string, 10);
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<ConversationSchema | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [agentAction, setAgentAction] = useState<string>("Thinking...");
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [agentId, setAgentId] = useState<number | undefined>();
  const [agentDetails, setAgentDetails] = useState<AgentDetails>();
  const usePolling = useRef<boolean>(true);
  const streamingEnabled = useRef<boolean>(false);

  const initialized = useRef(false);

  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const abortStreamRef = useRef<(() => void) | null>(null);

  const isAgentDeleted = !!conversation?.agent.deleted_at;
  const isAgentCorrupted = !!conversation?.agent.corrupted;

  const scrollToLastMessage = (timeout = 0) => {
    setTimeout(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
    }, timeout);
  };

  // Cleanup SSE stream on unmount
  useEffect(() => {
    return () => {
      if (abortStreamRef.current) {
        abortStreamRef.current();
        abortStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      const initChat = pendingMessage && !initialized.current;

      if (initChat) {
        initialized.current = true;
        await onMessageComposerSubmit(pendingMessage);
      }

      const conversation = await adminApiClient.conversations().getConversation(conversationId);
      setConversation(conversation);
      setAgentId(conversation.agent?.id);

      if (pendingMessage) {
        return;
      }

      const initialMessages = conversation.history as MessageProps[];
      setMessages(initialMessages);

      scrollToLastMessage(100);
    };
    const checkStream = async () => {
      try {
        const streamStatus = await adminApiClient.conversations().getStreamStatus();

        if (streamStatus.active) {
          streamingEnabled.current = true
        } else if (!streamStatus.active) {
          streamingEnabled.current = false
        }
      } catch {
        streamingEnabled.current = false
      }
    };
    const initChat = async () => {
      await checkStream();
      await loadMessages();
  };
    initChat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadAgentDetails = async () => {
      if (!agentId || agentDetails) {
        return;
      }

      try {
        const agentDetails = await adminApiClient.agents().getAgentById(agentId);
        setAgentDetails(agentDetails);
      } catch (error) {
        console.error('Failed to load agent details:', error);
      }
    };

    loadAgentDetails();
  }, [agentId, agentDetails]);

  const handleSseMessage = (eventType: string, payload: any) => {
    const handlers: Record<string, () => void> = {
      on_parser_start: () => {
        setIsAgentLoading(true);
      },
      on_parser_stream: () => {
        const chunk = payload?.chunk;
        
        if (chunk === undefined || chunk === null) {
          console.warn("Missing chunk in payload:", payload);
          return;
        }
        
        const chunkStr = String(chunk);
        
        setIsLoading(false);
        setIsAgentLoading(false);

        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];

          if (lastMessage && lastMessage.type === "ai" && lastMessage.id === null) {
            return [
              ...prevMessages.slice(0, -1),
              { ...lastMessage, text: lastMessage.text + chunkStr }
            ];
          } else {
            return [...prevMessages, { type: "ai", text: chunkStr, id: null }];
          }
        });

        scrollToLastMessage();
      },
      message_id: () => {
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          lastMessage.id = payload.output;
          return [...prevMessages.slice(0, -1), lastMessage];
        });
      },
      action: () => {
        setAgentAction(payload.output);
      },
      error: () => {
        setIsLoading(false);
        setIsAgentLoading(false);
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "system", text: payload.output, id: null },
        ]);
      },
    };

    const handler = handlers[eventType];
    if (handler) {
      handler();
    }
  };

  const createSseConnection = async (conversationId: number): Promise<boolean> => {
    try {
      // Close existing stream if any
      if (abortStreamRef.current) {
        abortStreamRef.current();
        abortStreamRef.current = null;
      }

      const { stream, abort } = await adminSdk.client.fetchStream(`/enthusiast/conversations/${conversationId}/stream`);

      if (!stream) {
        usePolling.current = true;
        return false;
      }

      abortStreamRef.current = abort;

      const processEvent = async (stream: any) => {
        try {
          for await (const chunk of stream) {
            const eventType = chunk.event
            const eventData = chunk.data
            if (!eventType || !eventData || !eventData.length) {
              continue;
              }
            const dataObj = JSON.parse(chunk.data)

            handleSseMessage(eventType, dataObj);
          }
        } catch (error) {
          if (error instanceof Error && error.name !== "AbortError") {
            console.error("SSE stream error:", error);
          usePolling.current = true;
          }
        } finally {
          abortStreamRef.current = null;
        }
      };
        await processEvent(stream);

      return true;
    } catch (error) {
      console.error("Failed to create SSE connection:", error);
      usePolling.current = true;
      return false;
    }
  };

  const updateTaskStatus = async (conversationId: number, taskHandle: TaskHandle, streaming: boolean) => {
    if (streaming) {
      return;
    }

    try {
      const response = await adminApiClient.conversations().fetchResponseMessage(conversationId!, taskHandle);

      if (response) {
        setIsAgentLoading(false);
        setMessages((prev) => [
          ...prev,
          { type: "ai", text: response.text, id: response.id }
        ]);
        setIsLoading(false);
        scrollToLastMessage();
      } else {
        setTimeout(() => updateTaskStatus(conversationId, taskHandle, streaming), 2000);
      }
    } catch {
      setIsLoading(false);
      setIsAgentLoading(false);
    }
  };

  const addFileMessages = (files: MessageFile[]) => {
    const fileMessages = files.map<FileMessageProps>(file => ({
      id: null,
      type: "file",
      file_name: file.name,
      file_type: file.type
    }));

    setMessages((prev) => [ ...prev, ...fileMessages ]);
  }

  const addUserMessage = (message: string) => {
    setMessages((prev) => [
      ...prev,
      { type: "human", text: message, id: null }
    ]);
    scrollToLastMessage();
  };

  const onMessageComposerSubmit = async (message: Message) => {
    setIsLoading(true);
    setIsAgentLoading(true);
    addFileMessages(message.files);
    addUserMessage(message.text);

    const taskHandle = await adminApiClient.conversations().sendMessage(conversationId, dataSetId!, message.text, streamingEnabled.current, message.files.map(f => f.id));
    usePolling.current = !taskHandle.streaming;
    if (taskHandle.streaming) {
      const connected = await createSseConnection(conversationId);
      if (!connected) {
        usePolling.current = true;
      }
    }

    try {
      updateTaskStatus(conversationId, taskHandle, !usePolling);
    } catch {
      setIsLoading(false);
      setIsAgentLoading(false);
    }
  };

  const isUserMessage = (message: MessageProps) => {
    return message.type === "human" || message.type === "file";
  };

  return (
    <PageMain className="h-full py-0">
      {conversation &&
        <>
          <PageHeading
              title={pendingMessage?.text || conversation.summary!}
              description={`Chat with ${conversation.agent.name}`}
              className="sticky top-0 pt-4 bg-white z-10"
          >
            <Button className="ml-auto mr-0" variant="outline" onClick={() => navigate(`/enthusiast/dataset/${dataSetId}/chat?agent=${encodeURIComponent(conversation.agent.id)}`)}>
              <PlusIcon />
              New Chat
            </Button>
          </PageHeading>
          <ChatWindow
            className="pt-16"
            onSubmit={onMessageComposerSubmit}
            isLoading={isLoading}
            conversationLocked={isAgentDeleted || isAgentCorrupted}
            conversationId={conversationId}
            agentId={agentId}
            fileUploadEnabled={agentDetails?.file_upload}
          >
            <div className="grow flex-1 space-y-4">
              {messages.map((message, index) => {
                const inMessageGroup = isUserMessage(message) && index > 0 && isUserMessage(messages[index - 1]);

                if (message.type === "system") {
                  return (
                    <MessageError key={index} text={message.text} />
                  );
                }

                if (message.type === "file") {
                  return (
                    <AttachmentBubble key={index} variant="primary" message={message} inMessageGroup={inMessageGroup} />
                  );
                }

                if (message.type === 'ai' && message.text === '') {
                  return (<MessageBubbleTyping key={index} text={agentAction} />);
                }

                return (
                  <MessageBubble
                    key={index}
                    text={message.text}
                    variant={message.type === "human" ? "primary" : "secondary"}
                    questionId={message.id}
                    inMessageGroup={inMessageGroup}
                  />
                );
              })}
              {isAgentLoading && <MessageBubbleTyping text={agentAction} />}
              <div className="mb-4" />
              <div ref={lastMessageRef} />
            </div>
          </ChatWindow>
        </>
      }
    </PageMain>
  );
}
