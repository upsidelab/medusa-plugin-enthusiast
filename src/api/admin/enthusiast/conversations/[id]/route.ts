import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../../modules/enthusiast"
import EnthusiastService from "../../../../../modules/enthusiast/service";
import {withEnthusiastErrorHandling} from "../../../../../api/wrappers";

export const GET = withEnthusiastErrorHandling(async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  const conversationId = parseInt(req.params.id);
  
  const conversation = await enthusiastService.getConversation(conversationId);
  
  res.status(200).json(conversation);
})

export const POST =  withEnthusiastErrorHandling(async (
  req: MedusaRequest<{ question_message: string; data_set_id: number; streaming: boolean; file_ids?: number[] }>,
  res: MedusaResponse
) =>  {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  const conversationId = parseInt(req.params.id);
  const { question_message, data_set_id, streaming, file_ids } = req.body;
  
  const taskHandle = await enthusiastService.sendMessage(
    conversationId,
    data_set_id,
    question_message,
    streaming,
    file_ids
  );
  
  res.status(200).json(taskHandle);
})

