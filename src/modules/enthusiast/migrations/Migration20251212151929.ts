import { Migration } from "@mikro-orm/migrations";

export class Migration20251212151929 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "enthusiast_dataset" drop constraint if exists "enthusiast_dataset_is_used_unique";`
    );
    this.addSql(
      `create table if not exists "enthusiast_dataset" ("id" text not null, "external_id" integer not null, "name" text not null default 'Dataset', "is_connected" boolean not null default false, "last_synced" timestamptz null, "plugin_id" integer null, "task_id" text null, "sync_status" text check ("sync_status" in ('processing', 'success', 'failed')) null, "api_key_id" text null, "is_used" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "enthusiast_dataset_pkey" primary key ("id"));`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_enthusiast_dataset_deleted_at" ON "enthusiast_dataset" (deleted_at) WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_enthusiast_dataset_is_used_unique" ON "enthusiast_dataset" (is_used) WHERE is_used IS TRUE AND deleted_at IS NULL;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "enthusiast_dataset" cascade;`);
  }
}
