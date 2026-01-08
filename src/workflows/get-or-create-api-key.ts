import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import {createApiKeysStep} from "@medusajs/core-flows";
createApiKeysStep

type ApiKey = any | null

const findExistingApiKeyStep = createStep(
  "find-existing-api-key",
  async (_: void, { container }) => {
    const apiKeyModuleService = container.resolve(Modules.API_KEY)

    const apiKeys = await apiKeyModuleService.listApiKeys({
      title: "Enthusiast API Key",
      type: "secret",
    })

    const existing = apiKeys.filter(key => key.created_by === "enthusiast-plugin").find((k) => !k.revoked_at && !k.deleted_at)

    return new StepResponse<ApiKey>(existing ?? null)
  }
)

const createApiKeyIfMissingStep = createStep(
  "create-api-key-if-missing",
  async ({ existingApiKey }: { existingApiKey: ApiKey }, { container }) => {
    if (existingApiKey) {
      return new StepResponse(existingApiKey)
    }

    const apiKeyModuleService = container.resolve(Modules.API_KEY)

    const apiKey = await apiKeyModuleService.createApiKeys({
      title: "Enthusiast API Key",
      type: "secret",
      created_by: "enthusiast-plugin",
    })

    return new StepResponse(apiKey)
  }
)

export const getOrCreateApiKeyWorkflow = createWorkflow(
  "get-or-create-api-key",
  function () {
    const existingApiKey = findExistingApiKeyStep()
    const apiKey = createApiKeyIfMissingStep({ existingApiKey })

    return new WorkflowResponse(apiKey)
  }
)

export default getOrCreateApiKeyWorkflow