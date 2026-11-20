import type { ValidationTargets } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import type { ZodType } from 'zod'

/** zValidator que lanza el error para que lo formatee el handler central (`lib/errors.ts`). */
export const validar = <T extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      throw new HTTPException(400, { cause: result.error })
    }
  })
