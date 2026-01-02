CREATE TABLE "auth_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "auth_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "custom_auth"."users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "custom_auth"."users" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_id_users_id_fk";
--> statement-breakpoint
CREATE INDEX "idx_auth_users_email" ON "auth_users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_auth_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP SCHEMA "custom_auth";
