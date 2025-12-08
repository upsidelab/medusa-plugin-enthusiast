import {
    Container,
    createDataTableColumnHelper,
    DataTable,
    Heading,
    useDataTable,
    Text
} from "@medusajs/ui"
import { useNavigate } from "react-router-dom";
import { EnthusiastDatasetSelector } from "./dataset-selector";
import {useEffect, useState} from "react";
import {DataSetResponse} from "../../modules/enthusiast/api/types/dataset";
import {adminApiClient} from "../../admin/lib/admin-client";
import {Agent} from "../../modules/enthusiast/api/types/agent";

const columnHelper = createDataTableColumnHelper<Agent>()

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    enableSorting: true,
    sortLabel: "Name",
  }),
]


export const AgentTable = () => {
    const [dataset, setDataset] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [agents, setAgents] = useState<Agent[]>([])
    const navigate = useNavigate()

    useEffect(() => {
        const fetchDatasetAgents = async () => {
              try {
                setIsLoading(true)
                const res = await adminApiClient.agents().getDatasetAgents(parseInt(dataset!))
                setAgents(res)
              } catch (e) {
                setError("Failed to load datasets")
              } finally {
                setIsLoading(false)
              }
            }
            if (!dataset) {
                return
            }
            fetchDatasetAgents()
    }, [dataset])

    const data = [
      {id: "1", name: "OCR Order", description: "Makes an order form note."},
      {id: "2", name: "Catalog Enrichment", description: "Extract products data from files."},
      {id: "3", name: "Product Search", description: "Search for products based on user query."},
      {id: "4", name: "User Manuals", description: "Answer questions related to products."},
  ]

  const table = useDataTable({
    columns,
    data: agents || [],
    getRowId: (row) => row.id.toString(),
    rowCount: data.length,
    onRowClick(event, row) {
        navigate(`/enthusiast/dataset/${dataset}/chat?agent=${row.id}`)
    },
  })

  return (
      <div>
          <Container>
            <Text>Dataset:</Text>
            <EnthusiastDatasetSelector value={dataset}  onChange={setDataset} />
          </Container>
        <DataTable instance={table}>
          <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <Heading>Agents</Heading>
            <div className="flex gap-2">
            </div>
          </DataTable.Toolbar>
          <DataTable.Table />
        </DataTable>
      </div>

  )
}