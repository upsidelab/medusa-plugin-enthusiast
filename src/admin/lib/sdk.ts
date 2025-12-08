import Medusa from "@medusajs/js-sdk"

export const adminSdk = new Medusa({
    baseUrl: 'http://localhost:9000/admin',
    debug: true,
    auth: {
        type: "session",
    },
})