import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChannelsSolid } from "@medusajs/icons"
import {EnthusiastMain} from "../../../components/admin/main.tsx";



const EnthusiastPage = () => {
  return <EnthusiastMain />
}

export const config = defineRouteConfig({
  label: "Enthusiast",
  icon: ChannelsSolid,
})

export default EnthusiastPage
