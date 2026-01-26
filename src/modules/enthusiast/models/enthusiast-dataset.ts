import { model } from "@medusajs/framework/utils";
import { SyncStatus } from "../types";

const EnthusiastDataset = model
  .define("enthusiast_dataset", {
    id: model.id().primaryKey(),
    external_id: model.number(),
    name: model.text().default("Dataset"),
    is_connected: model.boolean().default(false),
    last_synced: model.dateTime().nullable(),
    plugin_id: model.number().nullable(),
    task_id: model.text().nullable(),
    sync_status: model.enum(SyncStatus).nullable(),
    api_key_id: model.text().nullable(),
    is_active: model.boolean().default(false),
  })
  .indexes([
    {
      on: ["is_active"],
      where: {
        is_active: true,
      },
      unique: true,
    },
  ]);

export default EnthusiastDataset;
