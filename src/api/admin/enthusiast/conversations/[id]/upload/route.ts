import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ENTHUSIAST_MODULE } from "../../../../../../modules/enthusiast"
import EnthusiastService from "../../../../../../modules/enthusiast/service";
import { MedusaError } from "@medusajs/utils";

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const enthusiastService: EnthusiastService = req.scope.resolve(ENTHUSIAST_MODULE)
  const conversationId = parseInt(req.params.id);
  const file = req.file as Express.Multer.File

  if (!file) {
    throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No file was uploaded"
    )
  }
  
  const uploadResponse = await enthusiastService.uploadFile(
    conversationId,
    file
  );
  
  res.status(200).json(uploadResponse);
}

