/*
 Navicat Premium Dump SQL

 Source Server         : 104.168.125.34PostgreSql
 Source Server Type    : PostgreSQL
 Source Server Version : 160015 (160015)
 Source Host           : 104.168.125.34:5432
 Source Catalog        : iagent
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 160015 (160015)
 File Encoding         : 65001

 Date: 23/09/2026 13:44:05
*/


-- ----------------------------
-- Table structure for skill
-- ----------------------------
DROP TABLE IF EXISTS "public"."skill";
CREATE TABLE "public"."skill" (
  "id" int4 NOT NULL DEFAULT nextval('skill_id_seq'::regclass),
  "name" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "display_name" varchar(128) COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default" NOT NULL,
  "input_schema" jsonb NOT NULL,
  "output_schema" jsonb,
  "handler_type" varchar(32) COLLATE "pg_catalog"."default" NOT NULL,
  "endpoint" varchar(512) COLLATE "pg_catalog"."default",
  "handler_ref" varchar(255) COLLATE "pg_catalog"."default",
  "auth_type" varchar(32) COLLATE "pg_catalog"."default",
  "auth_config" jsonb,
  "metadata" jsonb,
  "enabled" bool NOT NULL DEFAULT true,
  "is_default" bool DEFAULT false,
  "created_at" timestamptz(6) DEFAULT now(),
  "updated_at" timestamptz(6) DEFAULT now()
)
;

-- ----------------------------
-- Uniques structure for table skill
-- ----------------------------
ALTER TABLE "public"."skill" ADD CONSTRAINT "skill_name_key" UNIQUE ("name");

-- ----------------------------
-- Primary Key structure for table skill
-- ----------------------------
ALTER TABLE "public"."skill" ADD CONSTRAINT "skill_pkey" PRIMARY KEY ("id");
