import { ZodError } from 'zod';
import { ApiError } from './errors.js';

/**
 * Validate `req.body`, `req.query` and/or `req.params` against zod schemas.
 * On failure we return field-level details so the client can show them next to
 * each input. Server-side validation is mandatory (prd/agent.md sections 8, 14).
 */
export function validate(schemas) {
  return (req, _res, next) => {
    try {
      for (const [key, schema] of Object.entries(schemas)) {
        req[key] = schema.parse(req[key]);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          ApiError.badRequest(
            'Please check the submitted details.',
            error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            }))
          )
        );
        return;
      }
      next(error);
    }
  };
}
