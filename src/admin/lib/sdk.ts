import Medusa from "@medusajs/js-sdk"
import {getBackendUrl} from "./utils";

export const adminSdk = new Medusa({
    baseUrl: getBackendUrl(),
    debug: true,
    auth: {
        type: "session",
    },
})