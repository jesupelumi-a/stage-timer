CREATE TYPE "public"."session_status" AS ENUM('running', 'paused', 'stopped');--> statement-breakpoint
CREATE TYPE "public"."timer_appearance" AS ENUM('TOD', 'COUNTDOWN', 'COUNTUP', 'HIDDEN');--> statement-breakpoint
CREATE TYPE "public"."timer_trigger" AS ENUM('MANUAL', 'SCHEDULED');--> statement-breakpoint
CREATE TYPE "public"."timer_type" AS ENUM('DURATION', 'FIXED_TIME');--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"timer_id" integer NOT NULL,
	"text" text NOT NULL,
	"color" text DEFAULT '#ffffff' NOT NULL,
	"bold" boolean DEFAULT false NOT NULL,
	"uppercase" boolean DEFAULT false NOT NULL,
	"index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "timer_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"timer_id" integer NOT NULL,
	"kickoff" bigint,
	"deadline" bigint,
	"last_stop" bigint,
	"status" "session_status" DEFAULT 'stopped' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timers" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"name" text NOT NULL,
	"notes" text DEFAULT '',
	"extra" text DEFAULT '',
	"appearance" timer_appearance DEFAULT 'COUNTDOWN' NOT NULL,
	"type" timer_type DEFAULT 'DURATION' NOT NULL,
	"trigger" timer_trigger DEFAULT 'MANUAL' NOT NULL,
	"duration_ms" integer NOT NULL,
	"yellow_warning_ms" integer DEFAULT 60000,
	"red_warning_ms" integer DEFAULT 30000,
	"index" integer NOT NULL,
	"show_name" boolean DEFAULT true NOT NULL,
	"show_notes" boolean DEFAULT false NOT NULL,
	"show_extra" boolean DEFAULT false NOT NULL,
	"start_time" timestamp,
	"start_date" boolean DEFAULT false NOT NULL,
	"finish_time" timestamp,
	"finish_date" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_timer_id_timers_id_fk" FOREIGN KEY ("timer_id") REFERENCES "public"."timers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timer_sessions" ADD CONSTRAINT "timer_sessions_timer_id_timers_id_fk" FOREIGN KEY ("timer_id") REFERENCES "public"."timers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timers" ADD CONSTRAINT "timers_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;