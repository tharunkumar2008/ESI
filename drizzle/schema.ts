import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, double, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const substations = mysqlTable("substations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  location: varchar("location", { length: 120 }).notNull(),
  latitude: double("latitude").notNull(),
  longitude: double("longitude").notNull(),
  status: varchar("status", { length: 32 }).default("normal").notNull(),
});

export const transformers = mysqlTable("transformers", {
  id: int("id").autoincrement().primaryKey(),
  substationId: int("substationId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  capacity: double("capacity").notNull(),
  status: varchar("status", { length: 32 }).default("normal").notNull(),
});

export const feeders = mysqlTable("feeders", {
  id: int("id").autoincrement().primaryKey(),
  transformerId: int("transformerId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  status: varchar("status", { length: 32 }).default("normal").notNull(),
});

export const sections = mysqlTable("sections", {
  id: int("id").autoincrement().primaryKey(),
  feederId: int("feederId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  location: varchar("location", { length: 120 }).notNull(),
  status: varchar("status", { length: 32 }).default("normal").notNull(),
});

export const readings = mysqlTable("readings", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  voltage: double("voltage").notNull(),
  current: double("current").notNull(),
  power: double("power").notNull(),
  energy: double("energy").notNull(),
  powerFactor: double("powerFactor").notNull(),
  loadPercentage: double("loadPercentage").notNull(),
});

export const electricSignatures = mysqlTable("electricSignatures", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull(),
  feature: varchar("feature", { length: 64 }).notNull(),
  baselineValue: double("baselineValue").notNull(),
  minValue: double("minValue").notNull(),
  maxValue: double("maxValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const anomalies = mysqlTable("anomalies", {
  id: int("id").autoincrement().primaryKey(),
  readingId: int("readingId"),
  type: varchar("type", { length: 120 }).notNull(),
  deviationScore: double("deviationScore").notNull(),
  riskScore: double("riskScore").notNull(),
  confidence: double("confidence").notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 32 }).default("investigation_required").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  anomalyId: int("anomalyId"),
  severity: varchar("severity", { length: 32 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 32 }).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const simulationEvents = mysqlTable("simulationEvents", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 64 }).notNull(),
  location: varchar("location", { length: 64 }).notNull(),
  parameters: text("parameters").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const runtimeState = mysqlTable("runtimeState", {
  id: int("id").autoincrement().primaryKey(),
  mode: varchar("mode", { length: 64 }).default("normal").notNull(),
  activeSection: varchar("activeSection", { length: 32 }).default("SEC-31").notNull(),
  activeAnomalyId: int("activeAnomalyId"),
  simulationActive: boolean("simulationActive").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
