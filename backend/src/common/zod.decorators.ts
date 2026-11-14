import {
  createParamDecorator,
  ExecutionContext,
  UnprocessableEntityException,
} from '@nestjs/common';
import { z } from 'zod';
function validationError(error: z.ZodError): UnprocessableEntityException {
  return new UnprocessableEntityException(
    error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    }),
  );
}
function parseOrThrow<T extends z.ZodType>(
  schema: T,
  value: unknown,
): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw validationError(result.error);
  return result.data;
}
interface SchemaHolder {
  schema: z.ZodType;
}
const holder = (schema: z.ZodType): SchemaHolder => ({ schema });
function fromRequest(
  ctx: ExecutionContext,
  source: 'body' | 'query' | 'params',
): unknown {
  const request = ctx.switchToHttp().getRequest<Record<string, unknown>>();
  return request[source];
}
const ZodBodyDecorator = createParamDecorator(
  (data: SchemaHolder, ctx: ExecutionContext) =>
    parseOrThrow(data.schema, fromRequest(ctx, 'body')),
);
const ZodQueryDecorator = createParamDecorator(
  (data: SchemaHolder, ctx: ExecutionContext) =>
    parseOrThrow(data.schema, fromRequest(ctx, 'query')),
);
const ZodParamsDecorator = createParamDecorator(
  (data: SchemaHolder, ctx: ExecutionContext) =>
    parseOrThrow(data.schema, fromRequest(ctx, 'params')),
);
export const ZodBody = (schema: z.ZodType) => ZodBodyDecorator(holder(schema));
export const ZodQuery = (schema: z.ZodType) =>
  ZodQueryDecorator(holder(schema));
export const ZodParams = (schema: z.ZodType) =>
  ZodParamsDecorator(holder(schema));
