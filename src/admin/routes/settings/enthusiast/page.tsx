import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import {DatasetTable} from "../../../../components/admin/dataset-table.tsx";


const EnthusiastSettingPage = () => {
  return (
    <DatasetTable/>
  )
}

export const config = defineRouteConfig({
  label: "Enthusiast",
  icon: ChatBubbleLeftRight,
})

export default EnthusiastSettingPage