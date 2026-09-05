import { doublePrecision, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomPhaseEnum = pgEnum("room_phase", [
  "preferences",
  "shortlist",
  "voting",
  "final",
]);

export type StoredVenuePlan = {
  id: string;
  name: string;
  detail: string;
  category: string;
  budget: string;
  distance: string;
  matchPercent: number;
  reasons: string[];
  venue: {
    category: string;
    address: string;
    distanceMeters: number;
    rating?: number;
    openNow?: boolean;
    mapsUrl: string;
  };
};

export const roomsTable = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  hostTokenHash: text("host_token_hash").notNull(),
  phase: roomPhaseEnum("phase").notNull().default("preferences"),
  shortlist: text("shortlist").array().notNull().default([]),
  venueShortlist: jsonb("venue_shortlist").$type<StoredVenuePlan[]>().notNull().default([]),
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),
  locationAccuracy: integer("location_accuracy"),
  venueStatus: text("venue_status").notNull().default("fallback-no-location"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;