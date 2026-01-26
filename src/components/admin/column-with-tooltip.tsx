import { Tooltip } from "@medusajs/ui";
import { InformationCircle } from "@medusajs/icons";

type ColumnHeaderWithTooltipProps = {
  name: string;
  tooltip: string;
};

export const ColumnHeaderWithTooltip = ({ name, tooltip }: ColumnHeaderWithTooltipProps) => {
  return (
    <div className="flex items-center gap-x-1">
      <span>{name}</span>

      {tooltip && (
        <Tooltip content={tooltip}>
          <button type="button" className="text-ui-fg-subtle hover:text-ui-fg-base">
            <InformationCircle />
          </button>
        </Tooltip>
      )}
    </div>
  );
};
