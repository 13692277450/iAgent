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

 Date: 23/09/2026 13:50:14
*/


-- ----------------------------
-- Table structure for mcp_server_access
-- ----------------------------
DROP TABLE IF EXISTS "public"."mcp_server_access";
CREATE TABLE "public"."mcp_server_access" (
  "id" int8 NOT NULL DEFAULT nextval('mcp_server_access_id_seq'::regclass),
  "mcp_server_id" int8 NOT NULL,
  "username" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "permission" varchar(16) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'read'::character varying,
  "granted_by" varchar(64) COLLATE "pg_catalog"."default",
  "granted_at" timestamptz(6) NOT NULL DEFAULT now(),
  "expires_at" timestamptz(6),
  "revoked" bool NOT NULL DEFAULT false
)
;

-- ----------------------------
-- Indexes structure for table mcp_server_access
-- ----------------------------
CREATE INDEX "idx_access_server" ON "public"."mcp_server_access" USING btree (
  "mcp_server_id" "pg_catalog"."int8_ops" ASC NULLS LAST
) WHERE revoked = false;
CREATE INDEX "idx_access_user" ON "public"."mcp_server_access" USING btree (
  "username" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
) WHERE revoked = false;

-- ----------------------------
-- Uniques structure for table mcp_server_access
-- ----------------------------
ALTER TABLE "public"."mcp_server_access" ADD CONSTRAINT "uniq_access_user_server" UNIQUE ("mcp_server_id", "username");

-- ----------------------------
-- Checks structure for table mcp_server_access
-- ----------------------------
ALTER TABLE "public"."mcp_server_access" ADD CONSTRAINT "chk_access_permission" CHECK (permission::text = ANY (ARRAY['read'::character varying, 'write'::character varying, 'admin'::character varying]::text[]));

-- ----------------------------
-- Primary Key structure for table mcp_server_access
-- ----------------------------
ALTER TABLE "public"."mcp_server_access" ADD CONSTRAINT "mcp_server_access_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table mcp_server_access
-- ----------------------------
ALTER TABLE "public"."mcp_server_access" ADD CONSTRAINT "mcp_server_access_mcp_server_id_fkey" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."mcp_server" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
