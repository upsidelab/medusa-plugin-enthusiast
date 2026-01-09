import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../../modules/enthusiast"
import EnthusiastService from "../../../../../modules/enthusiast/service";
import {withErrorHandler} from "../../../../../api/wrappers";

export const GET = withErrorHandler(async(
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  const taskId = req.params.id;
  
  const taskState = await enthusiastService.getTaskStatus({
    task_id: taskId
  } as any);
  
  res.status(200).json({ state: taskState });
})
