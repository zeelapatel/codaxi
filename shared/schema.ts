import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export interface ProjectSummary {
  overview: string;
  architecture: string;
  testingApproach: string;
  codeQuality: string;
}

export interface ProjectStats {
  jsFiles: number;
  jsonFiles: number;
  mdFiles: number;
}

export interface MainFile {
  path: string;
  description: string;
}

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Project schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  language: text("language").notNull(),
  repository_url: text("repository_url"),
  file_count: integer("file_count").notNull(),
  total_lines: integer("total_lines").notNull(),
  stats: jsonb("stats").notNull(),
  main_files: jsonb("main_files").notNull().default('[]'),
  dependencies: jsonb("dependencies").notNull().default('[]'),
  summary: jsonb("summary").notNull().default('{"overview":"","architecture":"","testingApproach":"","codeQuality":""}'),
  user_id: integer("user_id").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects, {
  summary: z.object({
    overview: z.string(),
    architecture: z.string(),
    testingApproach: z.string(),
    codeQuality: z.string()
  }).default({
    overview: "",
    architecture: "",
    testingApproach: "",
    codeQuality: ""
  })
}).pick({
  name: true,
  language: true,
  repository_url: true,
  file_count: true,
  total_lines: true,
  stats: true,
  main_files: true,
  dependencies: true,
  summary: true,
  user_id: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sections: jsonb("sections").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  projectId: true,
  title: true,
  content: true,
  sections: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Graph data schema
export interface GraphData {
  nodes: Array<{
    id: string;
    name: string;
    group: number;
    radius: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    value: number;
  }>;
}

export const graphData = pgTable("graph_data", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  data: jsonb("data").notNull().$type<GraphData>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertGraphDataSchema = createInsertSchema(graphData).pick({
  projectId: true,
  data: true
});

export type InsertGraphData = z.infer<typeof insertGraphDataSchema>;
export type GraphDataRecord = typeof graphData.$inferSelect;
