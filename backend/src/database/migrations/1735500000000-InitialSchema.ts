import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1735500000000 implements MigrationInterface {
  name = 'InitialSchema1735500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ---------- ENUMS ----------
    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('CUSTOMER', 'PROVIDER', 'ADMIN')`);
    await queryRunner.query(
      `CREATE TYPE "providers_status_enum" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "service_requests_status_enum" AS ENUM ('DRAFT', 'SUBMITTED', 'MATCHING', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "leads_status_enum" AS ENUM ('GENERATED', 'DELIVERED', 'VIEWED', 'ACCEPTED', 'REJECTED', 'CONTACTED', 'CONVERTED', 'EXPIRED')`,
    );

    // ---------- USERS ----------
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255),
        "name" varchar(150) NOT NULL,
        "phone" varchar(30),
        "role" users_role_enum NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`);

    // ---------- REGIONS ----------
    await queryRunner.query(`
      CREATE TABLE "regions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "name" varchar(150) NOT NULL,
        "code" varchar(20) NOT NULL
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_regions_code" ON "regions" ("code")`);

    // ---------- COMMUNES ----------
    await queryRunner.query(`
      CREATE TABLE "communes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "name" varchar(150) NOT NULL,
        "code" varchar(20) NOT NULL,
        "region_id" uuid NOT NULL REFERENCES "regions"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_communes_code" ON "communes" ("code")`);
    await queryRunner.query(`CREATE INDEX "IDX_communes_region_id" ON "communes" ("region_id")`);

    // ---------- CATEGORIES ----------
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "name" varchar(150) NOT NULL,
        "slug" varchar(170) NOT NULL,
        "icon" varchar(100),
        "is_active" boolean NOT NULL DEFAULT true,
        "order" int NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_categories_slug" ON "categories" ("slug")`);

    // ---------- SERVICES ----------
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
        "name" varchar(150) NOT NULL,
        "slug" varchar(170) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_services_slug" ON "services" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_services_category_id" ON "services" ("category_id")`);

    // ---------- PROVIDERS ----------
    await queryRunner.query(`
      CREATE TABLE "providers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "business_name" varchar(200) NOT NULL,
        "legal_name" varchar(200),
        "rut" varchar(20),
        "description" text,
        "phone" varchar(30) NOT NULL,
        "email" varchar(255) NOT NULL,
        "website" varchar(255),
        "whatsapp" varchar(30),
        "logo_url" varchar(500),
        "status" providers_status_enum NOT NULL DEFAULT 'PENDING'
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_providers_status" ON "providers" ("status")`);

    // ---------- PROVIDER_SERVICES ----------
    await queryRunner.query(`
      CREATE TABLE "provider_services" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "provider_id" uuid NOT NULL REFERENCES "providers"("id") ON DELETE CASCADE,
        "service_id" uuid NOT NULL REFERENCES "services"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_provider_services_provider_service" ON "provider_services" ("provider_id", "service_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_provider_services_service_id" ON "provider_services" ("service_id")`);

    // ---------- PROVIDER_COMMUNES ----------
    await queryRunner.query(`
      CREATE TABLE "provider_communes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "provider_id" uuid NOT NULL REFERENCES "providers"("id") ON DELETE CASCADE,
        "commune_id" uuid NOT NULL REFERENCES "communes"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_provider_communes_provider_commune" ON "provider_communes" ("provider_id", "commune_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_provider_communes_commune_id" ON "provider_communes" ("commune_id")`);

    // ---------- SERVICE_REQUESTS ----------
    await queryRunner.query(`
      CREATE TABLE "service_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "customer_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
        "service_id" uuid NOT NULL REFERENCES "services"("id") ON DELETE RESTRICT,
        "commune_id" uuid NOT NULL REFERENCES "communes"("id") ON DELETE RESTRICT,
        "description" text NOT NULL,
        "address" varchar(300),
        "preferred_date" date,
        "budget_min" numeric(12,0),
        "budget_max" numeric(12,0),
        "contact_name" varchar(150) NOT NULL,
        "contact_email" varchar(255) NOT NULL,
        "contact_phone" varchar(30) NOT NULL,
        "consent_accepted_at" timestamptz NOT NULL,
        "status" service_requests_status_enum NOT NULL DEFAULT 'DRAFT'
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_service_requests_service_id" ON "service_requests" ("service_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_service_requests_commune_id" ON "service_requests" ("commune_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_service_requests_status" ON "service_requests" ("status")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_matching" ON "service_requests" ("service_id", "commune_id", "status")`,
    );

    // ---------- LEADS ----------
    await queryRunner.query(`
      CREATE TABLE "leads" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "service_request_id" uuid NOT NULL REFERENCES "service_requests"("id") ON DELETE CASCADE,
        "provider_id" uuid NOT NULL REFERENCES "providers"("id") ON DELETE CASCADE,
        "status" leads_status_enum NOT NULL DEFAULT 'GENERATED',
        "price" numeric(12,0) NOT NULL DEFAULT 0,
        "is_paid" boolean NOT NULL DEFAULT false,
        "contacted_at" timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_leads_request_provider" ON "leads" ("service_request_id", "provider_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_leads_provider_status" ON "leads" ("provider_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_leads_status" ON "leads" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "leads"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "provider_communes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "provider_services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "providers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "communes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "regions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "leads_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "providers_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
