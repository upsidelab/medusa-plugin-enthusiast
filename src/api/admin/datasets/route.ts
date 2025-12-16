import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import EnthusiastService from "../../../modules/enthusiast/service";
import {ENTHUSIAST_MODULE} from "../../../modules/enthusiast";
import {PostCreateDatasetSchema} from "../../admin/datasets/validators";
import {z} from "zod";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  res.json(await enthusiastService.listInternalDatasets(req.scope))
}

type PostCreateDatasetSchemaType = z.infer<
  typeof PostCreateDatasetSchema
>

export  const POST = async (req: MedusaRequest<PostCreateDatasetSchemaType>, res: MedusaResponse) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  res.json(await enthusiastService.datasetCreate(req.body))
}