import React from "react";
import { MessageComposer } from "../../components/chat/message-composer";


import type { OnSubmit } from "../../components/chat/message-composer";
import {cn} from "../../admin/lib/utils";

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
  fileUploadEnabled
}: ChatWindowProps) {
  return (
    <div className={cn("flex flex-col h-full px-4", className)}>
      {children}
      <div className="bottom-0 sticky flex-shrink-0 pb-4">
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
