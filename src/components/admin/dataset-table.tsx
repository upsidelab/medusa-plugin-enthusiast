import {
    Container,
    createDataTableColumnHelper,
    DataTable,
    Heading,
    Text,
    useDataTable,
} from "@medusajs/ui"
import {useEffect, useState} from "react";
import {adminApiClient} from "../../admin/lib/admin-client";
import {EnthusiastDatasetType} from "../../admin/lib/types";
import {CircleCheckBig, Plus, RefreshCw} from "lucide-react";
import {ActionMenu} from "../../components/admin/action-menu";
import {ColumnHeaderWithTooltip} from "../../components/admin/column-with-tooltip";
import {Spinner, SquareGreenSolid, SquareRedSolid} from "@medusajs/icons";
import {DatasetCreateForm} from "../../components/admin/dataset-create-form";
import {LoadingSpinner} from "../../components/utils/spinner";


export const DatasetTable = () => {
    const [datasets, setDatasets] = useState<EnthusiastDatasetType[]>([])
    const [refetch, setRefetch] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true)
    //todo use errors
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDataset = async () => {
              try {
                setIsLoading(true)
                const res = await adminApiClient.dataSets().getInternalDataSets()
                setDatasets(res)
              } catch (e) {
                setError("Failed to load datasets")
              } finally {
                setIsLoading(false)
                setRefetch(false)
              }
            }
            fetchDataset()
    }, [refetch])

  const columnHelper = createDataTableColumnHelper<EnthusiastDatasetType>()

const columns = [
  columnHelper.accessor("name", {
    header: "Name"
  }),
  columnHelper.accessor("is_active", {
    header: () => {
        return (
            <ColumnHeaderWithTooltip name="Active" tooltip="Active dataset will be used in all chats"/>
        )
    },
    cell: ({getValue}) => {
        return getValue() ? (<SquareGreenSolid />) : (<SquareRedSolid />)
    }
  }),
  columnHelper.accessor("is_connected", {
    header: () => {
        return (
            <ColumnHeaderWithTooltip name="Connected" tooltip="Determines if Enthusiast dataset has added Medusa products source."/>
        )
    },
    cell: ({getValue}) => {
        return getValue() ? (<SquareGreenSolid />) : (<SquareRedSolid />)
    }
  }),
  columnHelper.accessor("sync_status", {
    header: "Synchronization Status",
  }),
  columnHelper.accessor("last_synced", {
    header: "Last synchronized",
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const dataset = row.original

      return (
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <CircleCheckBig />,
                  disabled: !dataset.is_connected || dataset.is_active,
                  label: "Set as active",
                  onClick: async () => {
                      await adminApiClient.dataSets().setAsActive(dataset.id)
                      setRefetch(true)
                  }
                },
                {
                  icon: <Plus />,
                  disabled: dataset.is_connected,
                  label: "Connect",
                  onClick: async () => {
                      await adminApiClient.dataSets().connectDatasets(dataset.id)
                      setRefetch(true)
                  }
                },
                {
                  icon: <RefreshCw />,
                  label: "Synchronize",
                  onClick: async () => {
                      await adminApiClient.dataSets().synchronizeDatasets(dataset.id)
                      setRefetch(true)
                  }
                },
              ],
            },
          ]}
        />
      )
    },
  }),

]
  const table = useDataTable({
    columns,
    data: datasets || [],
    getRowId: (row) => row.id,
    rowCount: datasets.length,
  })

  if (isLoading) {
      return (
          <LoadingSpinner />
      )
  }

  return (
      <Container>

          <div>
            <DataTable instance={table}>
              <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                <div className="flex flex-col">
                  <Heading>Enthusiast Datasets</Heading>
                  <Text className="text-ui-fg-subtle" size="small">
                    This table lists all enthusiast datasets available in your store.
                  </Text>
                </div>
                <DatasetCreateForm setRefetch={setRefetch} />
              </DataTable.Toolbar>
              <DataTable.Table />
            </DataTable>
          </div>
      </Container>

  )
}