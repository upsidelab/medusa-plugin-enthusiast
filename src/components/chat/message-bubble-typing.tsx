import styles from './message-bubble-typing.module.css';
import {cn} from "../../admin/lib/utils";

export interface MessageBubbleTypingProps {
  text: string | null;
}

export function MessageBubbleTyping({ text }: MessageBubbleTypingProps) {
  return (
    <div className="flex flex-col">
      <div className={cn("items-centered rounded-lg px-3 py-4 text-sm", styles.typing)}>
        <div className={styles.typingDot} />
        <div className={styles.typingDot} />
        <div className={styles.typingDot} />
      </div>
      {text && (
        <p className="text-sm ml-2 -mt-1 text-muted-foreground">{text}</p>
      )}
    </div>
  );
}
