import {
  createDataTableColumnHelper,
  DataTable,
  Heading,
  useDataTable,
  Button,
  Container,
  Text,
} from "@medusajs/ui";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminApiClient } from "../../admin/lib/admin-client";
import { useActiveDataset } from "../../admin/hooks/use-active-dataset";
import { AgentDetails } from "../../modules/enthusiast/api/types/agent";
import { LoadingSpinner } from "../../components/utils/spinner";
import { ChatBubble, CogSixTooth } from "@medusajs/icons";
import noDatasetsImage from "../../admin/assets/no-datasets.png";

const columnHelper = createDataTableColumnHelper<AgentDetails>();

const columns = (navigate: (path: string) => void) => [
  columnHelper.accessor("name", {
    header: "Name",
    enableSorting: true,
    sortLabel: "Name",
  }),
  columnHelper.accessor("description", {
    header: "Description",
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/enthusiast/chat?agent=${row.original.id}`);
            }}
          >
            <ChatBubble />
            Start Chat
          </Button>
        </div>
      );
    },
  }),
];

export const AgentTable = () => {
  const { dataset, hasAnyDatasets, isLoading: isDatasetLoading } = useActiveDataset();
  const noDatasets = !isDatasetLoading && hasAnyDatasets === false;
  const noActiveDatasets = !isDatasetLoading && hasAnyDatasets === true && dataset === null;
  const [isLoading, setIsLoading] = useState(true);
  const [agents, setAgents] = useState<AgentDetails[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatasetAgents = async () => {
      if (!dataset) {
        setAgents([]);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const res = await adminApiClient.agents().getDatasetAgents(dataset.external_id);
        const availableAgents = res.filter((agent) => !agent.corrupted);
        const availableAgentsDetails = await Promise.all(
          availableAgents.map((agent) => {
            return adminApiClient.agents().getAgentById(agent.id);
          })
        );
        setAgents(availableAgentsDetails);
      } finally {
        setIsLoading(false);
      }
    };
    if (!isDatasetLoading) {
      void fetchDatasetAgents();
    }
  }, [dataset, isDatasetLoading]);

  const table = useDataTable({
    columns: columns(navigate),
    data: agents || [],
    getRowId: (row) => row.id.toString(),
    rowCount: agents.length,
    onRowClick(event, row) {
      navigate(`/enthusiast/chat?agent=${row.id}`);
    },
  });
  if (isLoading) {
    return <LoadingSpinner />;
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
            <h2 className="text-lg font-semibold text-gray-900">
              Enthusiast needs to be configured.
            </h2>
            <p className="text-gray-600 text-xs leading-relaxed">
              Go to settings to configure your Enthusiast connection.
            </p>
            <div className="pt-1">
              <Button
                variant="secondary"
                size="small"
                onClick={() => navigate("/enthusiast/settings")}
                className="border border-gray-300"
              >
                Open Settings
              </Button>
            </div>
          </div>
        </div>
      </Container>
    );
  }
  if (noActiveDatasets) {
    navigate("/enthusiast/settings");
  }
  return (
    <Container className="p-4">
      <div className="flex flex-col min-h-0">
        <DataTable instance={table}>
          <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center flex-shrink-0">
            <div>
              <Heading>Agents</Heading>
              <Text className="text-ui-fg-subtle" size="small">
                Choose an agent to start a session
              </Text>
            </div>
            <Button variant="secondary" onClick={() => navigate("/enthusiast/settings")}>
              <CogSixTooth />
              Settings
            </Button>
          </DataTable.Toolbar>
          <div
            className="overflow-auto min-h-0 max-h-[calc(100vh-16rem)]"
            onWheel={(e) => {
              const container = e.currentTarget;
              container.scrollTop += e.deltaY;
            }}
          >
            <DataTable.Table
              emptyState={{
                empty: {
                  heading: "No agents available",
                  description: "You can configure available agents in Enthusiast's admin panel",
                },
              }}
            />
          </div>
        </DataTable>
      </div>
    </Container>
  );
};
