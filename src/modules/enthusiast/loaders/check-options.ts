import type { LoaderOptions } from "@medusajs/framework/types"
import {PluginOptions} from "@/settings";
import { asValue } from "@medusajs/framework/awilix"


export default async function checkOptionsLoader({ options, container }: LoaderOptions) {
    const configModule = container.resolve("configModule")
    const moduleOptions = options as PluginOptions
    const required = {
          enthusiastApiUrl: moduleOptions.enthusiastApiUrl,
          enthusiastServiceAccountToken: moduleOptions.enthusiastServiceAccountToken,
          enthusiastMedusaSourcePluginName: moduleOptions.enthusiastMedusaSourcePluginName,
    }
    const defaults = {
        medusaBackendUrl: configModule.admin.backendUrl !== "/" ? configModule.admin.backendUrl : "http://host.docker.internal:9000",
    }

    const errors = Object.entries(required)
      .filter(([key, value]) => !value)
      .map(([key]) => `Missing required option: ${key}`)

    if (errors.length > 0) {
      throw new Error(`[enthusiast] Plugin configuration error:\n${errors.join("\n")}`)
    }
    const finalOptions = {
        ...defaults,
        ...options,
    }

    container.register(
        {
            options: asValue(finalOptions)
        }
    )

}