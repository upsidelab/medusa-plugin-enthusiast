import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import EnthusiastService from "../../../../../modules/enthusiast/service";
import {ENTHUSIAST_MODULE} from "../../../../../modules/enthusiast";
import {withErrorHandler} from "../../../../wrappers";

export const POST = withErrorHandler(async (req: MedusaRequest, res: MedusaResponse) => {
    const { id } = req.params
    const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
    await enthusiastService.synchronizeDatasets(id, req.scope)
    res.status(200).json({})
})