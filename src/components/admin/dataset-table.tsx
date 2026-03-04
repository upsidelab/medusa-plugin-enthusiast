import {
  Container,
  createDataTableColumnHelper,
  DataTable,
  Heading,
  IconButton,
  Label,
  RadioGroup,
  Text,
  Tooltip,
  useDataTable,
} from "@medusajs/ui";
import { useCallback, useEffect, useState } from "react";
import { adminApiClient } from "../../admin/lib/admin-client";
import { EnthusiastDatasetType } from "../../admin/lib/types";
import { ColumnHeaderWithTooltip } from "../../components/admin/column-with-tooltip";
import { ArrowPath } from "@medusajs/icons";
import { DatasetCreateForm } from "../../components/admin/dataset-create-form";
import { getFullDate } from "../../admin/lib/utils";

export const DatasetTable = () => {
  const [datasets, setDatasets] = useState<EnthusiastDatasetType[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchDatasets = useCallback(async () => {
    const res = await adminApiClient.dataSets().getInternalDataSets();
    setDatasets(res);
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    void fetchDatasets();
  }, [fetchDatasets]);

  const columnHelper = createDataTableColumnHelper<EnthusiastDatasetType>();

  const columns = [
    columnHelper.accessor("name", {
      header: "Name",
    }),
    columnHelper.accessor("is_active", {
      header: () => {
        return (
          <ColumnHeaderWithTooltip
            name="Active"
            tooltip="Active dataset will be used in all chats."
          />
        );
      },
      cell: ({ getValue, row }) => {
        const isChecked = getValue();
        return (
          <RadioGroup
            value={isChecked ? row.original.id : ""}
            onValueChange={() => {
              void (async () => {
                try {
                  await adminApiClient.dataSets().setAsActive(row.original.id);
                  setDatasets((prev) =>
                    prev.map((dataset) => ({
                      ...dataset,
                      is_active: dataset.id === row.original.id,
                    }))
                  );
                } finally {
                  void fetchDatasets();
                }
              })();
            }}
          >
            <div className="flex items-center gap-x-3">
              <RadioGroup.Item
                value={row.original.id}
                id={`radio_${row.original.id}`}
                checked={isChecked}
              />
              <Label htmlFor={`radio_${row.original.id}`} weight="plus">
                Active
              </Label>
            </div>
          </RadioGroup>
        );
      },
    }),
    columnHelper.accessor("sync_status", {
      header: "Synchronization Status",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-x-3">
            <Label htmlFor={`${row.original.id}`} weight="plus">
              {row.original.sync_status}
            </Label>
            {row.original.sync_status && (
              <IconButton
                variant="transparent"
                onClick={() => {
                  void (async () => {
                    await adminApiClient.dataSets().synchronizeDatasets(row.original.id);
                    void fetchDatasets();
                  })();
                }}
              >
                <ArrowPath />
              </IconButton>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("last_synced", {
      header: "Last Synchronized",
      cell: ({ getValue }) => {
        const date = getValue();
        if (date) {
          return (
            <Tooltip content={getFullDate({ date, includeTime: true })}>
              <span>{getFullDate({ date })}</span>
            </Tooltip>
          );
        }
        return null;
      },
    }),
  ];
  const table = useDataTable({
    columns,
    data: datasets,
    getRowId: (row) => row.id,
    rowCount: datasets.length,
  });

  return (
    <Container>
      <div className="flex flex-col min-h-0">
        <DataTable instance={table}>
          <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center flex-shrink-0">
            <div className="flex flex-col">
              <Heading>Data Sets</Heading>
              <Text className="text-ui-fg-subtle" size="small">
                A data set represents a configuration of agents, products and documents sources
              </Text>
            </div>
            <DatasetCreateForm
              setRefetch={fetchDatasets}
              anyActive={datasets.some((dataset) => dataset.is_active)}
              isFirst={!datasets.length}
              defaultOpen={hasLoaded && datasets.length === 0}
            />
          </DataTable.Toolbar>
          <div
            className="flex-1 overflow-auto min-h-0 max-h-[calc(100vh-16rem)]"
            onWheel={(e) => {
              const container = e.currentTarget;
              container.scrollTop += e.deltaY;
            }}
          >
            <DataTable.Table
              emptyState={{
                empty: {
                  heading: "No Datasets",
                  description: "There is no datasets available.",
                },
              }}
            />
          </div>
        </DataTable>
      </div>
    </Container>
  );
};
