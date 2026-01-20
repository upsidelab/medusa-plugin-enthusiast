import { ReactNode } from "react";
import {cn} from "../../admin/lib/utils";
import {Container} from "@medusajs/ui";


export interface PageMainProps {
  className?: string;
  children: ReactNode;
}

export function PageMain({ children, className }: PageMainProps) {
  return (
    <Container className={cn("flex flex-col divide-y p-0 pt-4 h-full overflow-hidden", className)}>
      {children}
    </Container>
  )
}

