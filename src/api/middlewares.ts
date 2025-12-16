import {defineMiddlewares, validateAndTransformBody} from "@medusajs/framework/http"
import multer from "multer"
import {PostCreateDatasetSchema} from "../api/admin/datasets/validators";

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
    {
      matcher: "/enthusiast/datasets",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostCreateDatasetSchema),
      ],
    },

  ],
})