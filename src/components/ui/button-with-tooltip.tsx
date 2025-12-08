import { ReactNode } from "react";
import {Button, ButtonProps} from "../../components/ui/button";
import {Tooltip, TooltipContent, TooltipTrigger} from "../../components/ui/tooltip";

export interface ButtonWithTooltipProps extends ButtonProps {
  tooltip: string;
  children: ReactNode;
}

export function ButtonWithTooltip({ tooltip, children, ...buttonProps }: ButtonWithTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...buttonProps}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
} 