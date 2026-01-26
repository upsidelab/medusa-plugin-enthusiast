import { Heading, Button, Container } from "@medusajs/ui";
import { Check } from "@medusajs/icons";
import { Conversation } from "../../modules/enthusiast/api/types/conversation";
import { cn } from "../../admin/lib/utils";

interface ConversationHistoryProps {
  conversations: Conversation[];
  currentConversationId?: number;
  onConversationClick: (conversationId: number) => void;
  onNewChat: () => void;
}

export function ConversationHistory({
  conversations,
  currentConversationId,
  onConversationClick,
  onNewChat,
}: ConversationHistoryProps) {
  return (
    <Container className="h-full flex flex-col">
      <Heading level="h3" className="text-lg font-medium pb-4">
        Conversation History
      </Heading>
      <Button variant="secondary" size="small" className="w-full mb-3" onClick={onNewChat}>
        Start New Chat
      </Button>
      <div
        className="space-y-1 flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden pt-4"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {conversations.length === 0 ? (
          <div className="text-sm text-muted-foreground px-2 py-4 text-center">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = currentConversationId === conv.id;
            return (
              <button
                key={conv.id}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-ui-bg-base-hover transition-colors",
                  isSelected && "bg-muted"
                )}
                onClick={() => onConversationClick(conv.id)}
              >
                {isSelected && <Check className="w-4 h-4" />}
                {!isSelected && <div className="w-4 h-4" />}
                <span className="flex-1 text-left">
                  {conv.summary || `Conversation ${conv.id}`}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Container>
  );
}
