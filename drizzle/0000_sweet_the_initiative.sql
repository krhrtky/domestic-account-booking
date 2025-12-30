CREATE SCHEMA "custom_auth";
--> statement-breakpoint
CREATE TABLE "custom_auth"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT 'Household' NOT NULL,
	"ratio_a" integer DEFAULT 50 NOT NULL,
	"ratio_b" integer DEFAULT 50 NOT NULL,
	"user_a_id" uuid NOT NULL,
	"user_b_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ratio_sum" CHECK ("groups"."ratio_a" + "groups"."ratio_b" = 100),
	CONSTRAINT "unique_user_pair" CHECK ("groups"."user_a_id" != "groups"."user_b_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"inviter_id" uuid NOT NULL,
	"invitee_email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text NOT NULL,
	"payer_type" text NOT NULL,
	"payer_user_id" uuid,
	"actual_payer_type" text NOT NULL,
	"actual_payer_user_id" uuid,
	"expense_type" text DEFAULT 'Household' NOT NULL,
	"source_file_name" text,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"group_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "fk_groups_user_a" FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "fk_groups_user_b" FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payer_user_id_users_id_fk" FOREIGN KEY ("payer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_actual_payer_user_id_users_id_fk" FOREIGN KEY ("actual_payer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "custom_auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_custom_auth_users_email" ON "custom_auth"."users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_groups_user_a" ON "groups" USING btree ("user_a_id");--> statement-breakpoint
CREATE INDEX "idx_groups_user_b" ON "groups" USING btree ("user_b_id");--> statement-breakpoint
CREATE INDEX "idx_invitations_group" ON "invitations" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_invitations_email" ON "invitations" USING btree ("invitee_email");--> statement-breakpoint
CREATE INDEX "idx_transactions_group" ON "transactions" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_user" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_date" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_transactions_expense_type" ON "transactions" USING btree ("expense_type");--> statement-breakpoint
CREATE INDEX "idx_transactions_payer_user" ON "transactions" USING btree ("payer_user_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_actual_payer_type" ON "transactions" USING btree ("actual_payer_type");--> statement-breakpoint
CREATE INDEX "idx_transactions_actual_payer_user" ON "transactions" USING btree ("actual_payer_user_id");--> statement-breakpoint
CREATE INDEX "idx_users_group" ON "users" USING btree ("group_id");