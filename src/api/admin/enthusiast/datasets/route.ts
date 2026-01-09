import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../modules/enthusiast"
import EnthusiastService from "../../../../modules/enthusiast/service";
import {PostCreateDatasetSchema} from "../../../admin/datasets/validators";
import {z} from "zod";
import {withErrorHandler} from "../../../../api/wrappers";

type PostCreateDatasetSchemaType = z.infer<
  typeof PostCreateDatasetSchema
>


export const GET = withErrorHandler(async(
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  res.status(200).json(await enthusiastService.listDatasets());
})

export const POST = withErrorHandler(async (req: MedusaRequest<PostCreateDatasetSchemaType>, res: MedusaResponse) => {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  res.json(await enthusiastService.datasetCreate(req.body))
})
