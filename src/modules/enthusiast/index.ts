import EnthusiastService from "./service"
import { Module } from "@medusajs/framework/utils"
import checkOptionsLoader from "./loaders/check-options";

export const ENTHUSIAST_MODULE = "enthusiast"

export default Module(ENTHUSIAST_MODULE, {
    service: EnthusiastService,
    loaders: [checkOptionsLoader]
})
