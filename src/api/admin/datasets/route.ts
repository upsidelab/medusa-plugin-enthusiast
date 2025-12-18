import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import EnthusiastService from "../../../modules/enthusiast/service";
import {ENTHUSIAST_MODULE} from "../../../modules/enthusiast";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  res.json(await enthusiastService.listInternalDatasets(req.scope))
}
