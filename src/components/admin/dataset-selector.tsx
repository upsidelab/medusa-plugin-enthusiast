import {Select} from "@medusajs/ui";
import {adminSdk} from "../../admin/lib/sdk";
import {useEffect, useState} from "react";
import {DataSetResponse} from "../../modules/enthusiast/api/types/dataset";

export const EnthusiastDatasetSelector = ({
  value,
  onChange,
}) => {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [datasets, setDatasets] = useState<DataSetResponse[]>([])

    useEffect(() => {
        const fetchDatasets = async () => {
              try {
                setIsLoading(true)
                const res: DataSetResponse[] = await adminSdk.client.fetch(
                  "/enthusiast/datasets"
                )
                setDatasets(res)
              } catch (e) {
                setError("Failed to load datasets")
              } finally {
                setIsLoading(false)
              }
            }
            fetchDatasets()
    }, [])

    return (
        //todo
        <Select
          value={value || "1"}
          onValueChange={(v) => onChange?.(v)}
          disabled={isLoading || !!error}
        >
            <Select.Trigger>
                <Select.Value placeholder="Select dataset"/>
            </Select.Trigger>
            <Select.Content>
                {datasets.map((item) => (
                    <Select.Item key={item.id} value={item.id.toString()}>
                        {item.name}
                    </Select.Item>
                ))}
            </Select.Content>
        </Select>
    )
}
