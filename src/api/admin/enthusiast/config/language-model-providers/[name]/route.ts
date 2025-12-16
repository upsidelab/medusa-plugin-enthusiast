import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../../../modules/enthusiast"
import EnthusiastService from "../../../../../../modules/enthusiast/service";
import {useParams} from "react-router-dom";


export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  const { name } = useParams<{ name: string }>();
  res.status(200).json(await enthusiastService.listLanguageModels(name!));
}
