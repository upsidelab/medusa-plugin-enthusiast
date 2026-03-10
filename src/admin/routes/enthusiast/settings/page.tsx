import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DatasetTable } from "../../../../components/admin/dataset-table.tsx";

const EnthusiastSettingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const forceOpenCreate = searchParams.has("create_dataset");

  return (
    <DatasetTable
      forceOpenCreate={forceOpenCreate}
      onCreateSuccess={forceOpenCreate ? () => navigate("/enthusiast") : undefined}
    />
  );
};

export const config = defineRouteConfig({});

export default EnthusiastSettingPage;

export const handle = {
  breadcrumb: () => "Settings",
};
