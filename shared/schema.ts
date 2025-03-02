import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const svgDocuments = pgTable("svg_documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
});

export const insertSvgDocumentSchema = createInsertSchema(svgDocuments).pick({
  name: true,
  content: true,
});

export type InsertSvgDocument = z.infer<typeof insertSvgDocumentSchema>;
export type SvgDocument = typeof svgDocuments.$inferSelect;
