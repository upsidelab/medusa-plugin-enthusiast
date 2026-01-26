import { defineRouteConfig } from "@medusajs/admin-sdk";
import { DatasetTable } from "../../../../components/admin/dataset-table.tsx";

const EnthusiastSettingPage = () => {
  return <DatasetTable />;
};

export const config = defineRouteConfig({});

export default EnthusiastSettingPage;

export const handle = {
  breadcrumb: () => "Settings",
};
