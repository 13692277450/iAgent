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

 Date: 23/09/2026 13:48:28
*/


-- ----------------------------
-- Table structure for mcp_server
-- ----------------------------
DROP TABLE IF EXISTS "public"."mcp_server";
CREATE TABLE "public"."mcp_server" (
  "id" int8 NOT NULL DEFAULT nextval('mcp_server_id_seq'::regclass),
  "name" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "connection_type" varchar(16) COLLATE "pg_catalog"."default" NOT NULL,
  "connection_api" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "auth_type" varchar(16) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'none'::character varying,
  "auth_config" jsonb,
  "status" varchar(16) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'unknown'::character varying,
  "last_error" text COLLATE "pg_catalog"."default",
  "permission" varchar(16) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'read'::character varying,
  "enabled" bool NOT NULL DEFAULT false,
  "tools" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Indexes structure for table mcp_server
-- ----------------------------
CREATE UNIQUE INDEX "uniq_mcp_server_name" ON "public"."mcp_server" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Checks structure for table mcp_server
-- ----------------------------
ALTER TABLE "public"."mcp_server" ADD CONSTRAINT "chk_mcp_auth_type" CHECK (auth_type::text = ANY (ARRAY['none'::character varying, 'basic'::character varying, 'bearer'::character varying, 'api_key'::character varying]::text[]));
ALTER TABLE "public"."mcp_server" ADD CONSTRAINT "chk_mcp_status" CHECK (status::text = ANY (ARRAY['unknown'::character varying, 'connected'::character varying, 'error'::character varying, 'disabled'::character varying]::text[]));
ALTER TABLE "public"."mcp_server" ADD CONSTRAINT "chk_mcp_permission" CHECK (permission::text = ANY (ARRAY['read'::character varying, 'write'::character varying, 'admin'::character varying]::text[]));
ALTER TABLE "public"."mcp_server" ADD CONSTRAINT "chk_mcp_connection_type" CHECK (connection_type::text = ANY (ARRAY['http'::character varying, 'sse'::character varying, 'stdio'::character varying, 'tcp'::character varying, 'ftp'::character varying, 'sftp'::character varying, 'ws'::character varying, 'grpc'::character varying]::text[]));
ALTER TABLE "public"."mcp_server" ADD CONSTRAINT "chk_mcp_tools_is_array" CHECK (jsonb_typeof(tools) = 'array'::text);
ALTER TABLE "public"."mcp_server" ADD CONSTRAINT "chk_mcp_name_format" CHECK (name::text ~ '^[a-z][a-z0-9_-]{1,63}$'::text);
ALTER TABLE "public"."mcp_server" ADD CONSTRAINT "chk_mcp_connection_required_fields" CHECK ((connection_type::text = ANY (ARRAY['http'::character varying, 'sse'::character varying, 'ws'::character varying]::text[])) AND connection_api ? 'url'::text OR (connection_type::text = ANY (ARRAY['tcp'::character varying, 'grpc'::character varying]::text[])) AND connection_api ? 'host'::text AND connection_api ? 'port'::text OR (connection_type::text = ANY (ARRAY['ftp'::character varying, 'sftp'::character varying]::text[])) AND connection_api ? 'host'::text OR connection_type::text = 'stdio'::text AND connection_api ? 'command'::text);
ALTER TABLE "public"."mcp_server" ADD CONSTRAINT "chk_mcp_connection_is_object" CHECK (jsonb_typeof(connection_api) = 'object'::text);

-- ----------------------------
-- Primary Key structure for table mcp_server
-- ----------------------------
ALTER TABLE "public"."mcp_server" ADD CONSTRAINT "mcp_server_pkey" PRIMARY KEY ("id");
