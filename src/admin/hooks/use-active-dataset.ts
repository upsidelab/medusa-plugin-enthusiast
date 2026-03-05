import { useState, useEffect, useMemo } from "react";
import { adminApiClient } from "../lib/admin-client";
import { EnthusiastDatasetType } from "../lib/types";

export function useActiveDataset() {
  const [dataset, setDataset] = useState<EnthusiastDatasetType | null>(null);
  const [hasAnyDatasets, setHasAnyDatasets] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        setIsLoading(true);
        const res = await adminApiClient.dataSets().getInternalDataSets();
        setHasAnyDatasets(res.length > 0);
        const activeDataset = res.find((d) => d.is_active) ?? null;
        setDataset(activeDataset);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchDataset();
  }, []);

  const datasetId = useMemo(() => dataset?.external_id ?? null, [dataset]);

  return { dataset, datasetId, hasAnyDatasets, isLoading };
}

