import {AuthenticatedMedusaRequest, MedusaResponse} from "@medusajs/framework/http"
import EnthusiastService from "../../../modules/enthusiast/service";
import {ENTHUSIAST_MODULE} from "../../../modules/enthusiast";
import {withErrorHandler} from "../../../api/wrappers";

export const GET = withErrorHandler(async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  res.json(await enthusiastService.listInternalDatasets(req))
})
