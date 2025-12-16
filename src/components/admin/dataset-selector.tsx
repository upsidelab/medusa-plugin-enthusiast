import { Select } from "@medusajs/ui";
import { useEffect, useState } from "react";

export const EnthusiastDatasetSelector = ({ onChange, datasets }) => {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (datasets.length > 0 && !selected) {
      const initial = datasets[0].external_id.toString();
      setSelected(initial);
      onChange?.(initial);
    }
  }, [datasets]);

  return (
    <Select
      value={selected ?? undefined}
      onValueChange={(v) => {
        setSelected(v);
        onChange?.(v);
      }}
    >
      <Select.Trigger>
        <Select.Value placeholder="Select dataset" />
      </Select.Trigger>
      <Select.Content>
        {datasets.map((item) => (
          <Select.Item key={item.external_id} value={item.external_id.toString()}>
            {item.name}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};
