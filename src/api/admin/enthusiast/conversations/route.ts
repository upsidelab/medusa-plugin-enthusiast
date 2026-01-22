import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../modules/enthusiast"
import EnthusiastService from "../../../../modules/enthusiast/service";
import {withErrorHandler} from "../../../../api/wrappers";

export const GET = withErrorHandler(async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  const dataSetId = parseInt(String(req.query.data_set_id));
  const agentId = parseInt(String(req.query.agent_id));
  const page = parseInt(String(req.query.page)) || 1;
  
  if (!dataSetId) {
    res.status(400).json({ error: "data_set_id parameter is required" });
    return;
  }
  
  const result = await enthusiastService.getConversations(
    dataSetId,
    agentId,
    page
  );
  
  res.status(200).json(result);
})

export const POST =  withErrorHandler(async (
  req: MedusaRequest<{ agent_id: number }>,
  res: MedusaResponse
) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  const { agent_id } = req.body;
  
  const conversationId = await enthusiastService.conversationCreate(agent_id);
  
  res.status(200).json({ id: conversationId });
})

