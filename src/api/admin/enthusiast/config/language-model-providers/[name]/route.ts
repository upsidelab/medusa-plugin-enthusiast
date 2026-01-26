import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../../../modules/enthusiast";
import EnthusiastService from "../../../../../../modules/enthusiast/service";
import { withErrorHandler } from "../../../../../../api/wrappers";

export const GET = withErrorHandler(async (req: MedusaRequest, res: MedusaResponse) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE);
  const { name } = req.params as { name: string };
  res.status(200).json(await enthusiastService.listLanguageModels(name));
});
