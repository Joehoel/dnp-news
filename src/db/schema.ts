import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-valibot';

export const article = sqliteTable('articles', {
	id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
	slug: text('slug').unique().notNull(),
	title: text('title').notNull(),
	content: text('content').notNull(),
	excerpt: text('excerpt').notNull(),
	date: text('date').notNull(),
	url: text('url').notNull(),
});

export type Article = InferSelectModel<typeof article>;
export type InsertArticle = InferInsertModel<typeof article>;
export const insertArticleSchema = createInsertSchema(article);
export const selectArticleSchema = createSelectSchema(article);
