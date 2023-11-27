import { type inferAsyncReturnType } from '@trpc/server';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { createDb } from './db/client';

export const createContext = async (d1: D1Database) => {
	const db = createDb(d1);

	return { db };
};

export type Context = inferAsyncReturnType<typeof createContext>;
