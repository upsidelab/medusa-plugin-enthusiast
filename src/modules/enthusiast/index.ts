import EnthusiastService from "./service"
import { Module } from "@medusajs/framework/utils"

export const ENTHUSIAST_MODULE = "enthusiast"

export default Module(ENTHUSIAST_MODULE, {
    service: EnthusiastService
})
