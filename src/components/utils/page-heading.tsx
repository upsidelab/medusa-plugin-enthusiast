import { ReactNode } from "react";
import {cn} from "../../admin/lib/utils";


export interface PageHeadingProps {
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

export function PageHeading({ title, description, className, children }: PageHeadingProps) {
  return (
    <div className={cn("pb-4", className)}>
      <div className="flex">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
            { description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
