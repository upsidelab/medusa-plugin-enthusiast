import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../modules/enthusiast"
import EnthusiastService from "../../../../modules/enthusiast/service";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  const dataset = req.query.dataset as string;
  
  if (!dataset) {
    res.status(400).json({ error: "dataset parameter is required" });
    return;
  }
  
  const agents = await enthusiastService.apiClient().agents().getDatasetAvailableAgents(parseInt(dataset));
  
  res.status(200).json(agents);
}

