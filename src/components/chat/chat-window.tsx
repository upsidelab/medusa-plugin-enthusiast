import React from "react";
import { MessageComposer } from "../../components/chat/message-composer";
import type { OnSubmit } from "../../components/chat/message-composer";
import { cn } from "../../admin/lib/utils";

interface ChatWindowProps {
  children: React.ReactNode;
  className?: string;
  onSubmit: OnSubmit;
  isLoading: boolean;
  conversationLocked?: boolean;
  conversationId?: number;
  agentId?: number;
  fileUploadEnabled?: boolean;
}

export function ChatWindow({
  children,
  className,
  onSubmit,
  isLoading,
  conversationLocked,
  conversationId,
  agentId,
  fileUploadEnabled,
}: ChatWindowProps) {
  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-[18px]">{children}</div>
      <div className="flex-shrink-0 w-full px-8 pt-[18px] pb-[18px] bg-background">
        <MessageComposer
          onSubmit={onSubmit}
          isLoading={isLoading}
          conversationLocked={conversationLocked}
          conversationId={conversationId}
          agentId={agentId}
          fileUploadEnabled={fileUploadEnabled}
        />
      </div>
    </div>
  );
}
