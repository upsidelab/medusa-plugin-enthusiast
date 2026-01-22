import { defineRouteConfig } from "@medusajs/admin-sdk"
import {EnthusiastMain} from "../../../components/admin/main.tsx";
import {EnthusiastIcon} from "../../../components/icons/enthusiast.tsx";

const EnthusiastPage = () => {
  return <EnthusiastMain />
}

export const config = defineRouteConfig({
  label: "Enthusiast",
  icon: EnthusiastIcon,
})

export default EnthusiastPage
export const handle = {
  breadcrumb: () => "Enthusiast",
}
