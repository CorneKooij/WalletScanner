CREATE TABLE "balance_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" serial NOT NULL,
	"date" timestamp NOT NULL,
	"balance" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nfts" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" serial NOT NULL,
	"name" text NOT NULL,
	"collection" text,
	"image" text,
	"policy_id" text,
	"attributes" jsonb
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" serial NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"balance" numeric NOT NULL,
	"value_usd" numeric
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" serial NOT NULL,
	"type" text NOT NULL,
	"amount" numeric NOT NULL,
	"date" timestamp NOT NULL,
	"address" text,
	"full_address" text,
	"token_symbol" text,
	"token_amount" numeric,
	"explorer_url" text
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"handle" text,
	"last_updated" timestamp DEFAULT now(),
	CONSTRAINT "wallets_address_unique" UNIQUE("address")
);
--> statement-breakpoint
ALTER TABLE "balance_history" ADD CONSTRAINT "balance_history_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfts" ADD CONSTRAINT "nfts_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;