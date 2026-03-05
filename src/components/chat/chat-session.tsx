import { Navigate } from "react-router-dom";
import { toast } from "@medusajs/ui";
import { Spinner } from "@medusajs/icons";
import { ChatSidebar } from "./chat-sidebar";
import { ChatWindow } from "./chat-window";
import { MessageList } from "./message-list";
import { PageHeading } from "../utils/page-heading";
import { PageMain } from "../utils/page-main";
import { useConversation } from "../../admin/hooks/use-conversation";

interface ChatSessionProps {
  datasetId: number;
}

const ContentSpinner = () => (
  <div className="flex flex-1 items-center justify-center">
    <Spinner className="text-ui-fg-interactive animate-spin" />
  </div>
);

export function ChatSession({ datasetId }: ChatSessionProps) {
  const {
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
  } = useConversation(datasetId);

  if (isNew && !agentIdFromUrl) {
    toast.info("No agent.", { description: "Choose an agent to start a chat." });
    return <Navigate to="/enthusiast" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden px-1 py-2">
        <PageMain className="h-full">
          {isContentLoading ? (
            <ContentSpinner />
          ) : isNew ? (
            <>
              <PageHeading
                title={agentDetails?.name || ""}
                description="Start a new conversation."
                className="flex-shrink-0 bg-background z-[1] px-8"
              />
              <ChatWindow
                key={`new-${agentId}`}
                className="flex-1 min-h-0 pt-4"
                onSubmit={onSubmitNewChat}
                isLoading={false}
                agentId={agentId}
                fileUploadEnabled={agentDetails?.file_upload}
              >
                <div className="grow flex items-start justify-center pt-16">
                  {agentDetails?.description && (
                    <div className="text-center space-y-4 max-w-2xl px-6">
                      <div className="bg-background rounded-lg p-6">
                        <p className="text-gray-500 text-base leading-relaxed">
                          {agentDetails.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ChatWindow>
            </>
          ) : (
            conversation && (
              <>
                <PageHeading
                  title={agentDetails?.name || ""}
                  description={agentDetails?.description}
                  className="flex-shrink-0 bg-background z-[1] px-8"
                />
                <ChatWindow
                  className="flex-1 min-h-0"
                  onSubmit={(message) => void onMessageComposerSubmit(message)}
                  isLoading={isLoading}
                  conversationLocked={isAgentDeleted || isAgentCorrupted}
                  conversationId={conversationId}
                  agentId={agentId}
                  fileUploadEnabled={agentDetails?.file_upload}
                >
                  <MessageList
                    messages={messages}
                    agentAction={agentAction}
                    isAgentLoading={isAgentLoading}
                    lastMessageRef={lastMessageRef}
                  />
                </ChatWindow>
              </>
            )
          )}
        </PageMain>
      </div>
      <ChatSidebar currentAgentId={agentId!} currentConversationId={conversationId} />
    </div>
  );
}
