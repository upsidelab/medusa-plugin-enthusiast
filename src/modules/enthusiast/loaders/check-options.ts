import type { LoaderOptions } from "@medusajs/framework/types"
import {PluginOptions} from "@/settings";

export default async function checkOptionsLoader({ options, container }: LoaderOptions) {
  const moduleOptions = options as PluginOptions

  const required = {
      enthusiastApiUrl: moduleOptions.enthusiastApiUrl,
      enthusiastServiceAccountToken: moduleOptions.enthusiastServiceAccountToken,
      enthusiastMedusaSourcePluginName: moduleOptions.enthusiastMedusaSourcePluginName,
    }

    const errors = Object.entries(required)
      .filter(([key, value]) => !value)
      .map(([key]) => `Missing required option: ${key}`)

    if (errors.length > 0) {
      throw new Error(`[enthusiast] Plugin configuration error:\n${errors.join("\n")}`)
    }
}