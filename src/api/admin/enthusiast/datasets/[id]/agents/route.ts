import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../../../modules/enthusiast"
import EnthusiastService from "../../../../../../modules/enthusiast/service";
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  res.status(200).json(await enthusiastService.listAgents(parseInt(req.params.id)));
}
