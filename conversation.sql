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

 Date: 22/09/2026 15:10:43
*/


-- ----------------------------
-- Table structure for conversation
-- ----------------------------
DROP TABLE IF EXISTS "public"."conversation";
CREATE TABLE "public"."conversation" (
  "id" int8 NOT NULL DEFAULT nextval('conversation_id_seq'::regclass),
  "username" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "title" varchar(255) COLLATE "pg_catalog"."default" NOT NULL DEFAULT '新对话'::character varying,
  "model" varchar(64) COLLATE "pg_catalog"."default",
  "system_prompt" varchar(128) COLLATE "pg_catalog"."default",
  "message_count" int4 NOT NULL DEFAULT 0,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  "archived" bool NOT NULL DEFAULT false,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb
)
;

-- ----------------------------
-- Primary Key structure for table conversation
-- ----------------------------
ALTER TABLE "public"."conversation" ADD CONSTRAINT "conversation_pkey" PRIMARY KEY ("id");
