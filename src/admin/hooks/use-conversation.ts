import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "@medusajs/ui";
import { adminApiClient } from "../lib/admin-client";
import { enthusiastAdminSdk } from "../lib/sdk";
import { AgentDetails } from "../../modules/enthusiast/api/types/agent";
import {
  TaskHandle,
  Conversation as ConversationSchema,
} from "../../modules/enthusiast/api/types/conversation";
import { Message, OnSubmit } from "../../components/chat/message-composer";
import { FileMessageProps, MessageProps } from "../../components/chat/types";

export function useConversation(dataSetId: number) {
  const { chatId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isNew = chatId === "new";
  const conversationId = !isNew && chatId ? parseInt(chatId, 10) : undefined;

  const queryParams = new URLSearchParams(location.search);
  const agentIdFromUrl = queryParams.get("agent")
    ? parseInt(queryParams.get("agent")!, 10)
    : undefined;

  const locationState = location.state as { pendingMessage?: Message } | null;
  const pendingMessage = locationState?.pendingMessage;

  const [conversation, setConversation] = useState<ConversationSchema | null>(null);
  const [isContentLoading, setIsContentLoading] = useState(!isNew);
  const [isLoading, setIsLoading] = useState(false);
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [agentAction, setAgentAction] = useState<string>("Thinking...");
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [agentId, setAgentId] = useState<number | undefined>(agentIdFromUrl);
  const [agentDetails, setAgentDetails] = useState<AgentDetails | undefined>();

  const usePolling = useRef<boolean>(true);
  const streamingEnabled = useRef<boolean>(false);
  const initialized = useRef(false);
  const currentTaskHandleRef = useRef<TaskHandle | null>(null);
  const lastAddedMessageIdRef = useRef<number | null>(null);
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

  // Reset and load when chatId changes
  useEffect(() => {
    if (abortStreamRef.current) {
      abortStreamRef.current();
      abortStreamRef.current = null;
    }

    initialized.current = false;
    currentTaskHandleRef.current = null;
    lastAddedMessageIdRef.current = null;
    setMessages([]);
    setConversation(null);
    setAgentDetails(undefined);

    if (isNew) {
      setAgentId(agentIdFromUrl);
      setIsContentLoading(false);
      return;
    }

    setIsContentLoading(true);

    const checkStream = async () => {
      try {
        const streamStatus = await adminApiClient.conversations().getStreamStatus();
        streamingEnabled.current = streamStatus.active;
      } catch {
        streamingEnabled.current = false;
      }
    };

    const loadMessages = async () => {
      const conv = await adminApiClient.conversations().getConversation(conversationId!);

      // Guard: only allow access to conversations that belong to the active dataset.
      // The sidebar already filters by dataset, but a user could manually type a URL
      // with a conversation ID from a different dataset. This is a frontend-only check, since
      // Enthusiast itself does not restrict access to conversations besides the active dataset.
      if (String(conv.agent.dataset) !== String(dataSetId)) {
        toast.error("Conversation not found.", {
          description: "This conversation does not belong to the active dataset.",
          position: "top-right",
        });
        navigate("/enthusiast", { replace: true });
        return;
      }

      setConversation(conv);
      setAgentId(conv.agent?.id);

      if (pendingMessage && !initialized.current) {
        initialized.current = true;
        setIsContentLoading(false);
        // Send the pending message in the background — do NOT await it here,
        // as createSseConnection blocks until the entire stream completes.
        void onMessageComposerSubmit(pendingMessage);
        return;
      }

      const initialMessages = conv.history as MessageProps[];
      setMessages(initialMessages);
      setIsContentLoading(false);
      scrollToLastMessage(100);
    };

    void (async () => {
      await checkStream();
      await loadMessages();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // When switching agents on the 'new' chat, only the query param changes (chatId stays 'new')
  // so the main chatId effect won't fire — update agentId explicitly here
  useEffect(() => {
    if (!isNew || agentIdFromUrl === undefined) return;
    setAgentId(agentIdFromUrl);
    setAgentDetails(undefined);
    setIsContentLoading(true);
  }, [isNew, agentIdFromUrl]);

  // Load agent details when agentId becomes available or changes
  useEffect(() => {
    if (!agentId || agentDetails) return;

    const loadAgentDetails = async () => {
      try {
        const details = await adminApiClient.agents().getAgentById(agentId);
        setAgentDetails(details);
      } catch (error) {
        console.error("Failed to load agent details:", error);
      } finally {
        setIsContentLoading(false);
      }
    };

    void loadAgentDetails();
  }, [agentId, agentDetails]);

  const handleSseMessage = (eventType: string, payload: { chunk?: unknown; output?: unknown }) => {
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
        if (chunkStr.trim().length > 0) {
          setIsAgentLoading(false);
        }

        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];

          if (lastMessage && lastMessage.type === "ai" && lastMessage.id === null) {
            return [
              ...prevMessages.slice(0, -1),
              { ...lastMessage, text: lastMessage.text + chunkStr },
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
          lastMessage.id = payload.output as number | null;
          return [...prevMessages.slice(0, -1), lastMessage];
        });
      },
      action: () => {
        setAgentAction((payload.output as string) || "Thinking...");
        setIsAgentLoading(true);
      },
      error: () => {
        setIsLoading(false);
        setIsAgentLoading(false);
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "system", text: (payload.output as string) || "An error occurred", id: null },
        ]);
      },
    };

    const handler = handlers[eventType];
    if (handler) {
      handler();
    }
  };

  const createSseConnection = async (convId: number): Promise<boolean> => {
    try {
      if (abortStreamRef.current) {
        abortStreamRef.current();
        abortStreamRef.current = null;
      }

      const { stream, abort } = await enthusiastAdminSdk.client.fetchStream(
        `/enthusiast/conversations/${convId}/stream`
      );

      if (!stream) {
        usePolling.current = true;
        return false;
      }

      abortStreamRef.current = abort;

      const processEvent = async (stream: AsyncIterable<{ event?: string; data?: string }>) => {
        try {
          for await (const chunk of stream) {
            const eventType = chunk.event;
            const eventData = chunk.data;
            if (!eventType || !eventData || eventData.length === 0) {
              continue;
            }
            const dataObj = JSON.parse(eventData) as { chunk?: unknown; output?: unknown };
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

  const updateTaskStatus = async (convId: number, taskHandle: TaskHandle, streaming: boolean) => {
    if (streaming) return;
    if (currentTaskHandleRef.current?.task_id !== taskHandle.task_id) return;

    try {
      const response = await adminApiClient
        .conversations()
        .fetchResponseMessage(convId, taskHandle);

      if (response) {
        if (response.id && response.id === lastAddedMessageIdRef.current) {
          setIsAgentLoading(false);
          setIsLoading(false);
          return;
        }

        setIsAgentLoading(false);
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg.type === "ai" && msg.id === response.id);
          if (messageExists) return prev;
          return [...prev, { type: "ai", text: response.text, id: response.id }];
        });

        if (response.id) {
          lastAddedMessageIdRef.current = response.id;
        }
        setIsLoading(false);
        scrollToLastMessage();
      } else {
        setTimeout(() => {
          void updateTaskStatus(convId, taskHandle, streaming);
        }, 2000);
      }
    } catch {
      setIsLoading(false);
      setIsAgentLoading(false);
    }
  };

  const onMessageComposerSubmit = async (message: Message) => {
    const convId = conversationId!;

    setIsLoading(true);
    setIsAgentLoading(true);
    setMessages((prev) => {
      const messageExists = prev.some(
        (msg) => msg.type === "human" && msg.text === message.text && msg.id === null
      );

      if (!messageExists) {
        const fileMessages = message.files.map<FileMessageProps>((file) => ({
          id: null,
          type: "file",
          file_name: file.name,
          file_type: file.type,
        }));
        return [
          ...prev,
          ...fileMessages,
          { type: "human", text: message.text, id: null } as MessageProps,
        ];
      }
      return prev;
    });

    scrollToLastMessage(100);

    const taskHandle = await adminApiClient.conversations().sendMessage(
      convId,
      dataSetId,
      message.text,
      streamingEnabled.current,
      message.files.map((f) => f.id)
    );
    currentTaskHandleRef.current = taskHandle;
    usePolling.current = !taskHandle.streaming;

    if (pendingMessage && message.text === pendingMessage.text) {
      navigate(`/enthusiast/chat/${convId}`, { replace: true, state: {} });
    }

    if (taskHandle.streaming) {
      const connected = await createSseConnection(convId);
      if (!connected) {
        usePolling.current = true;
      }
    }

    try {
      void updateTaskStatus(convId, taskHandle, !usePolling);
    } catch {
      setIsLoading(false);
      setIsAgentLoading(false);
    }
  };

  const onSubmitNewChat: OnSubmit = (message, createdConversationId) => {
    void (async () => {
      const newConversationId =
        createdConversationId ??
        (await adminApiClient.conversations().createConversation(agentId!));
      navigate(`/enthusiast/chat/${newConversationId}`, {
        state: { pendingMessage: message },
        replace: true,
      });
    })();
  };

  return {
    isNew,
    conversationId,
    agentIdFromUrl,
    agentId,
    agentDetails,
    conversation,
    messages,
    isContentLoading,
    isLoading,
    isAgentLoading,
    agentAction,
    isAgentDeleted,
    isAgentCorrupted,
    lastMessageRef,
    onMessageComposerSubmit,
    onSubmitNewChat,
  };
}
