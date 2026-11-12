import { drizzle } from 'drizzle-orm/d1'
import type { Context } from 'hono'
import type { AppEnv } from '../env'
import * as schema from '../db/schema'

export const getDb = (c: Context<AppEnv>) => drizzle(c.env.DB, { schema })
export type Db = ReturnType<typeof getDb>

export const nuevoId = () => crypto.randomUUID()
export const ahoraIso = () => new Date().toISOString()
