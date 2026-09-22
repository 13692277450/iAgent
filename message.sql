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

 Date: 22/09/2026 15:11:40
*/


-- ----------------------------
-- Table structure for message
-- ----------------------------
DROP TABLE IF EXISTS "public"."message";
CREATE TABLE "public"."message" (
  "id" int8 NOT NULL DEFAULT nextval('message_id_seq'::regclass),
  "conversation_id" int8 NOT NULL,
  "username" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "role" varchar(16) COLLATE "pg_catalog"."default" NOT NULL,
  "content" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT ''::text,
  "parts" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "model" varchar(64) COLLATE "pg_catalog"."default",
  "prompt_tokens" int4 DEFAULT 0,
  "completion_tokens" int4 DEFAULT 0,
  "total_tokens" int4 DEFAULT 0,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb
)
;

-- ----------------------------
-- Checks structure for table message
-- ----------------------------
ALTER TABLE "public"."message" ADD CONSTRAINT "chk_message_role" CHECK (role::text = ANY (ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying, 'tool'::character varying]::text[]));

-- ----------------------------
-- Primary Key structure for table message
-- ----------------------------
ALTER TABLE "public"."message" ADD CONSTRAINT "message_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table message
-- ----------------------------
ALTER TABLE "public"."message" ADD CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
