import { initTRPC } from '@trpc/server';
import superJson from 'superjson';
import { type Context } from './context';

const t = initTRPC.context<Context>().create({
	transformer: superJson,
	errorFormatter({ shape }) {
		return shape;
	},
});

export const router = t.router;
export const publicProcedure = t.procedure;
