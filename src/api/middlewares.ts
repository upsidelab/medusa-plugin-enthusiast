import { defineMiddlewares } from "@medusajs/framework/http"
import multer from "multer"

const upload = multer()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/*",
      middlewares: [
        // @ts-ignore
        upload.single("file"),
      ],
    },
  ],
})