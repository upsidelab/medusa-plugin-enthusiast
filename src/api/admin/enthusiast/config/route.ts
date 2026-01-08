import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../modules/enthusiast"
import EnthusiastService from "../../../../modules/enthusiast/service";
import {withEnthusiastErrorHandling} from "../../../../api/wrappers";


export const GET = withEnthusiastErrorHandling(async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  res.status(200).json(await enthusiastService.getConfig());
})
