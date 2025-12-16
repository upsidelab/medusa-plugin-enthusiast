import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../modules/enthusiast"
import EnthusiastService from "../../../../modules/enthusiast/service";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  const dataSetId = req.query.data_set_id as string;
  const page = req.query.page as string || "1";
  
  if (!dataSetId) {
    res.status(400).json({ error: "data_set_id parameter is required" });
    return;
  }
  
  const result = await enthusiastService.getConversations(
    parseInt(dataSetId),
    parseInt(page)
  );
  
  res.status(200).json(result);
}

export async function POST(
  req: MedusaRequest<{ agent_id: number }>,
  res: MedusaResponse
) {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  const { agent_id } = req.body;
  
  const conversationId = await enthusiastService.conversationCreate(agent_id);
  
  res.status(200).json({ id: conversationId });
}

