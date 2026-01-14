import {
    createDataTableColumnHelper,
    DataTable,
    Heading,
    useDataTable,
    Button,
    Container,
    Text
} from "@medusajs/ui"
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {adminApiClient} from "../../admin/lib/admin-client";
import {AgentDetails} from "../../modules/enthusiast/api/types/agent";
import {EnthusiastDatasetType} from "@/admin/lib/types";
import {LoadingSpinner} from "../../components/utils/spinner";
import {CogSixTooth} from "@medusajs/icons";
import noDatasetsImage from "../../admin/assets/no-datasets.png";

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
    const [noDatasets, setNoDatasets] = useState<boolean | null>(null)
    const [noActiveDatasets, setNoActiveDatasets] = useState<boolean | null>(null)
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
                if (!res.length) {
                    setNoDatasets(true)
                    return
                }
                const activeDatasets = res.filter(dataset => dataset.is_active)
                if (!activeDatasets.length) {
                    setNoActiveDatasets(true)
                    return
                }
                setDataset(activeDatasets[0])
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
    if (noDatasets) {
        return (
            <Container>
            <div className="flex h-[385px] items-center justify-center">
                <div className="text-center space-y-3 max-w-md px-4">
                    <div className="flex justify-center mb-2">
                        <img 
                            src={noDatasetsImage}
                            alt="No connections illustration" 
                            className="h-48 w-auto"
                        />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">No connections yet</h2>
                    <p className="text-gray-600 text-xs leading-relaxed">
                        Set up your first connection to start syncing your store data with Enthusiast.
                    </p>
                    <div className="pt-1">
                        <Button 
                            variant="secondary" 
                            size="small"
                            onClick={() => navigate("/enthusiast/settings")}
                            className="border border-gray-300"
                        >
                            Settings
                        </Button>
                    </div>
                </div>
            </div>
            </Container>
        )
    }
    if (noActiveDatasets) {
        navigate("/enthusiast/settings")
    }
    return (
    <Container className="p-4">
        <DataTable instance={table} >
            <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div>
                <Heading>Agents</Heading>
                <Text className="text-ui-fg-subtle" size="small">
                    {`This table lists all agents available for ${dataset!.name}.`}
                </Text>
              </div>
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