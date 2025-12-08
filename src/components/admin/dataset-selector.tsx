import {Select} from "@medusajs/ui";
import {adminApiClient} from "../../admin/lib/admin-client";
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
                const res = await adminApiClient.dataSets().getDatasets()
                setDatasets(res)

                if (!value && res.length > 0 && onChange) {
                  onChange(res[0].id.toString())
                }
              } catch (e) {
                setError("Failed to load datasets")
              } finally {
                setIsLoading(false)
              }
            }
            fetchDatasets()
    }, [])

    return (
        <Select
          value={value || (datasets.length > 0 ? datasets[0].id.toString() : undefined)}
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
