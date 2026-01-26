import { cn } from "../../admin/lib/utils";

interface BaseBubbleProps {
  variant: "primary" | "secondary";
  children: React.ReactNode;
  className?: string;
  hasBackground?: boolean;
  inMessageGroup?: boolean;
}

export function BaseBubble({
  variant,
  children,
  className,
  hasBackground = false,
  inMessageGroup,
}: BaseBubbleProps) {
  return (
    <div className={cn("flex", inMessageGroup && "mt-2")}>
      <div
        className={cn(
          "flex flex-col max-w-[75%] gap-2 rounded-lg px-3 py-2 text-sm",
          variant === "primary" && "ml-auto",
          hasBackground &&
            variant === "primary" &&
            "bg-[#F4F4F5] dark:bg-[#2A2D31] text-foreground",
          hasBackground && variant === "secondary" && "bg-muted",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
