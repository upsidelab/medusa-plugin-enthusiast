import {
    createDataTableColumnHelper,
    DataTable,
    Heading,
    useDataTable,
    Button,
    Container
} from "@medusajs/ui"
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {adminApiClient} from "../../admin/lib/admin-client";
import {AgentDetails} from "../../modules/enthusiast/api/types/agent";
import {EnthusiastDatasetType} from "@/admin/lib/types";
import {LoadingSpinner} from "../../components/utils/spinner";
import {CogSixTooth} from "@medusajs/icons";

const columnHelper = createDataTableColumnHelper<AgentDetails>()

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    enableSorting: true,
    sortLabel: "Name",
  }),
  columnHelper.accessor("description", {
    header: "Description",
  }),

]


export const AgentTable = () => {
    const [dataset, setDataset] = useState<EnthusiastDatasetType | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [agents, setAgents] = useState<AgentDetails[]>([])
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
                const availableAgentsDetails = await Promise.all(
                    availableAgents.map(agent => {
                        return adminApiClient.agents().getAgentById(agent.id)
                    })
                )
                setAgents(availableAgentsDetails)
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
        navigate("/enthusiast/settings")
    }
    return (
    <Container className="p-4">
        <DataTable instance={table} >
          <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <Heading>Agents</Heading>
            <Button variant="secondary" onClick={() => navigate("/enthusiast/settings")}>
                <CogSixTooth />
                Settings
            </Button>
          </DataTable.Toolbar>
          <DataTable.Table
              emptyState={{
                  empty: {
                      heading: "No agents",
                      description: "There is no agents for active dataset."
                  }
              }}
          />
        </DataTable>
    </Container>
  )
}