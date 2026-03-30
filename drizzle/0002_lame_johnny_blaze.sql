-- First, set any existing 'free' plans to NULL before changing the enum
UPDATE "organizations" SET "plan" = NULL WHERE "plan" = 'free';--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "plan" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."plan";--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('starter', 'growth', 'business');--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "plan" SET DATA TYPE "public"."plan" USING "plan"::"public"."plan";--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "plan" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "plan" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "preview_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "preview_ends_at" timestamp;
