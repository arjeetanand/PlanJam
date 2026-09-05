import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { participantsTable } from "./participants";

export const activityEnum = pgEnum("activity", ["food", "movie", "games", "outdoors", "chill", "party"]);
export const budgetEnum = pgEnum("plan_budget", ["500", "1000", "1500", "2000-plus"]);
export const distanceEnum = pgEnum("plan_distance", ["nearby", "5km", "10km", "anywhere"]);
export const hardNoEnum = pgEnum("hard_no", ["crowds", "long-drives", "loud-venues", "spicy-food", "late-nights"]);

export const preferencesTable = pgTable(
  "preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    participantId: uuid("participant_id").notNull().references(() => participantsTable.id, { onDelete: "cascade" }),
    activity: activityEnum("activity").notNull(),
    budget: budgetEnum("budget").notNull(),
    distance: distanceEnum("distance").notNull(),
    hardNos: hardNoEnum("hard_nos").array().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("preferences_participant_unique").on(table.participantId)],
);
export const insertPreferenceSchema = createInsertSchema(preferencesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPreference = z.infer<typeof insertPreferenceSchema>;
export type Preference = typeof preferencesTable.$inferSelect;