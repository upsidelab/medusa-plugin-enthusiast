import { ReactNode } from "react";
import {Separator} from "./separator";
import {cn} from "../../admin/lib/utils";


export interface PageHeadingProps {
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
}

export function PageHeading({ title, description, className, children }: PageHeadingProps) {
  return (
    <div className={cn(className)}>
      <div className="flex">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
      <Separator className="my-6"/>
    </div>
  )
}
