import { MigrationInterface, QueryRunner } from 'typeorm';

export class WidenCommuneCode1735700000000 implements MigrationInterface {
  name = 'WidenCommuneCode1735700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "communes" ALTER COLUMN "code" TYPE varchar(50)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "communes" ALTER COLUMN "code" TYPE varchar(20)`);
  }
}
