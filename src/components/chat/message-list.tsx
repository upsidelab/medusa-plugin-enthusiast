import React from "react";
import { MessageBubble } from "./message-bubble";
import { AttachmentBubble } from "./attachment-bubble";
import { MessageError } from "./message-error";
import { MessageBubbleTyping } from "./message-bubble-typing";
import { MessageProps } from "./types";

interface MessageListProps {
  messages: MessageProps[];
  agentAction: string;
  isAgentLoading: boolean;
  lastMessageRef: React.MutableRefObject<HTMLDivElement | null>;
}

const isUserMessage = (message: MessageProps) =>
  message.type === "human" || message.type === "file";

export function MessageList({
  messages,
  agentAction,
  isAgentLoading,
  lastMessageRef,
}: MessageListProps) {
  return (
    <div className="grow flex-1 space-y-4">
      {messages.map((message, index) => {
        const inMessageGroup =
          isUserMessage(message) && index > 0 && isUserMessage(messages[index - 1]);

        if (message.type === "system") {
          return <MessageError key={index} text={message.text} />;
        }

        if (message.type === "file") {
          return (
            <AttachmentBubble
              key={index}
              variant="primary"
              message={message}
              inMessageGroup={inMessageGroup}
            />
          );
        }

        if (message.type === "ai" && message.text === "") {
          return <MessageBubbleTyping key={index} text={agentAction} />;
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
      {isAgentLoading && !messages.some((msg) => msg.type === "ai" && msg.text === "") && (
        <MessageBubbleTyping text={agentAction} />
      )}
      <div className="mb-4" />
      <div ref={lastMessageRef} />
    </div>
  );
}
