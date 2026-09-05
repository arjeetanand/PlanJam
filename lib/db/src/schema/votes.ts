import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { participantsTable } from "./participants";

export const votesTable = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    participantId: uuid("participant_id").notNull().references(() => participantsTable.id, { onDelete: "cascade" }),
    planId: text("plan_id").notNull(),
    vote: text("vote").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("votes_participant_plan_unique").on(table.participantId, table.planId)],
);
export const insertVoteSchema = createInsertSchema(votesTable).omit({ id: true, updatedAt: true });
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votesTable.$inferSelect;