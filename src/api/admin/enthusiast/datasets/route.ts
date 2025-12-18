import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../modules/enthusiast"
import EnthusiastService from "../../../../modules/enthusiast/service";
import {PostCreateDatasetSchema} from "../../../admin/datasets/validators";
import {z} from "zod";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  res.status(200).json(await enthusiastService.listDatasets());
}

type PostCreateDatasetSchemaType = z.infer<
  typeof PostCreateDatasetSchema
>

export  const POST = async (req: MedusaRequest<PostCreateDatasetSchemaType>, res: MedusaResponse) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  res.json(await enthusiastService.datasetCreate(req.body))
}
