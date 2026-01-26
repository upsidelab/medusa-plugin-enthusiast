import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { BaseBubble } from "../../components/chat/base-bubble";
import { FeedbackButton } from "../../components/chat/feedback-button";
import { CopyToClipboardButton } from "../../components/chat/copy-to-clipboard-button";
import { MessageFeedbackForm } from "../../components/message-feedback/message-feedback-form";

export interface MessageBubbleProps {
  text: string;
  variant: "primary" | "secondary";
  questionId: number | null;
  inMessageGroup?: boolean;
}

export function MessageBubble({ text, variant, questionId, inMessageGroup }: MessageBubbleProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>("");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    const processText = async () => {
      const { marked } = await import("marked");
      const rawHtml = await marked(text);
      const cleanHtml = DOMPurify.sanitize(rawHtml);
      setSanitizedHtml(cleanHtml);
    };

    void processText();
  }, [text]);

  const shouldShowActionButtons = variant === "secondary" && questionId !== null && text;

  const handleFeedbackClick = () => {
    setIsFeedbackOpen((prev) => !prev);
  };

  return (
    <BaseBubble variant={variant} hasBackground={true} inMessageGroup={inMessageGroup}>
      {text && <div className={variant} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />}

      {shouldShowActionButtons && (
        <div className="mt-4 flex items-center">
          <FeedbackButton isOpen={isFeedbackOpen} onClick={handleFeedbackClick} />
          <CopyToClipboardButton message={text} variant="ghost" />
        </div>
      )}

      {isFeedbackOpen && (
        <div className="feedback-form-modal mx-4">
          <MessageFeedbackForm messageId={questionId} />
        </div>
      )}
    </BaseBubble>
  );
}
