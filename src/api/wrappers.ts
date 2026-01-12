import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {MedusaError} from "@medusajs/utils";
import {EnthusiastAPIError} from "../modules/enthusiast/api/client";
import {EnthusiastServiceError} from "../modules/enthusiast/service";

export type MedusaHandler = (
  req: MedusaRequest,
  res: MedusaResponse
) => Promise<void>

const DEFAULT_ENTHUSIAST_ERROR_MESSAGE = "Unexpected Enthusiast error occurred."

export function withErrorHandler(handler: MedusaHandler): MedusaHandler {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (error: any) {
      const logger = req.scope.resolve("logger")
      if (error instanceof EnthusiastAPIError) {
        logger.error(`Enthusiast API error: ${error.message}, ${error.body}`)
        let errorType = MedusaError.Types.UNEXPECTED_STATE
        let errorMessage = DEFAULT_ENTHUSIAST_ERROR_MESSAGE

        if (req.method === "POST" && error.status === 400) {
          errorType = MedusaError.Types.INVALID_DATA
        }

        if (error.body) {
          errorMessage = error.body
        }

        throw new MedusaError(errorType, errorMessage)
      }
      if (error instanceof EnthusiastServiceError) {
        throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE,  error.message)
      }
      throw error
    }
  }
}