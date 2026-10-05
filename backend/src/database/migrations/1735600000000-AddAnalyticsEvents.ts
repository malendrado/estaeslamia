import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnalyticsEvents1735600000000 implements MigrationInterface {
  name = 'AddAnalyticsEvents1735600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "analytics_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "event_type" varchar(100) NOT NULL,
        "path" varchar(300),
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_analytics_events_type_created" ON "analytics_events" ("event_type", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "analytics_events"`);
  }
}
