import { InferTypeOf } from "@medusajs/framework/types";
import EnthusiastDataset from "../../modules/enthusiast/models/enthusiast-dataset";

export type EnthusiastDatasetType = InferTypeOf<typeof EnthusiastDataset>;
