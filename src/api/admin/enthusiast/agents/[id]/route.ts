import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../../modules/enthusiast"
import EnthusiastService from "../../../../../modules/enthusiast/service";
import { withErrorHandler } from "../../../../wrappers";

export const GET = withErrorHandler(async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  const agentId = parseInt(req.params.id);

  const agent = await enthusiastService.getAgentById(agentId);

  res.status(200).json(agent);
})