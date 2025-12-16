import { Migration } from '@mikro-orm/migrations';

export class Migration20251215080027 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "enthusiast_dataset" drop constraint if exists "enthusiast_dataset_is_active_unique";`);
    this.addSql(`drop index if exists "IDX_enthusiast_dataset_is_used_unique";`);

    this.addSql(`alter table if exists "enthusiast_dataset" rename column "is_used" to "is_active";`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_enthusiast_dataset_is_active_unique" ON "enthusiast_dataset" (is_active) WHERE is_active IS TRUE AND deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_enthusiast_dataset_is_active_unique";`);

    this.addSql(`alter table if exists "enthusiast_dataset" rename column "is_active" to "is_used";`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_enthusiast_dataset_is_used_unique" ON "enthusiast_dataset" (is_used) WHERE is_used IS TRUE AND deleted_at IS NULL;`);
  }

}
