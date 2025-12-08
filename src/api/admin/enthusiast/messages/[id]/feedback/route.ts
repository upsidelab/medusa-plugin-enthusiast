import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../../../modules/enthusiast"
import EnthusiastService from "../../../../../../modules/enthusiast/service";

export async function PATCH(
  req: MedusaRequest<{ rating: number | null; feedback: string }>,
  res: MedusaResponse
) {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  const messageId = parseInt(req.params.id);
  const { rating, feedback } = req.body;
  
  await enthusiastService.updateMessageFeedback(messageId, {
    rating,
    feedback
  });
  
  res.status(200).json({ success: true });
}

