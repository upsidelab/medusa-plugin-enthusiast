import {
    Container,
    createDataTableColumnHelper,
    DataTable,
    Heading,
    useDataTable,
    Text,
    Button
} from "@medusajs/ui"
import {Link, useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {adminApiClient} from "../../admin/lib/admin-client";
import {Agent} from "../../modules/enthusiast/api/types/agent";
import {EnthusiastDatasetType} from "@/admin/lib/types";
import {LoadingSpinner} from "../../components/utils/spinner";

const columnHelper = createDataTableColumnHelper<Agent>()

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    enableSorting: true,
    sortLabel: "Name",
  }),
]


export const AgentTable = () => {
    const [dataset, setDataset] = useState<EnthusiastDatasetType | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [agents, setAgents] = useState<Agent[]>([])
    const navigate = useNavigate()
    useEffect(() => {
        const fetchDatasetAgents = async () => {
            if (!dataset) {
                setAgents([])
                return
            }
            try {
                setIsLoading(true)
                const res = await adminApiClient.agents().getDatasetAgents(dataset.external_id)
                const availableAgents = res.filter(agent => !agent.corrupted)
                setAgents(availableAgents)
              } catch (e) {
                setError("Failed to load datasets")
              } finally {
                setIsLoading(false)
              }
            }
        fetchDatasetAgents()
    }, [dataset]);
    useEffect(() => {
        const fetchDataset = async () => {
            try {
                setIsLoading(true)
                const res = await adminApiClient.dataSets().getInternalDataSets()
                const activeDataset = res.filter(agent => agent.is_active)
                if (activeDataset.length) {
                    setDataset(activeDataset[0])
                }
              } catch (e) {
                setError("Failed to load dataset")
              } finally {
                setIsLoading(false)
              }
            }
        fetchDataset()
    }, []);
  const table = useDataTable({
    columns,
    data: agents || [],
    getRowId: (row) => row.id.toString(),
    rowCount: agents.length,
    onRowClick(event, row) {
        navigate(`/enthusiast/dataset/${dataset?.external_id}/chat?agent=${row.id}`)
    },
  })
    if (isLoading) {
        return (<LoadingSpinner />)
    }
    if (!dataset) {
        return (
            <Container className="divide-y p-0 px-6 py-4">
                <Text>There are not available datasets, go to settings to configure it.</Text>
              <Link to="/settings/enthusiast">
                <Button variant="secondary" size="small">
                  Go to Enthusiast Settings
                </Button>
              </Link>
            </Container>
        )
    }
    if (!agents || !agents.length) {
        return (
            <Container className="divide-y p-0 px-6 py-4">
                <Text>There are not available datasets, go to settings to configure it.</Text>
            </Container>
        )
    }
    return (
      <div>
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