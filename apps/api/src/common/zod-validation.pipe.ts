import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Pipe validasi berbasis skema zod dari @todosday/shared.
 * Pemakaian: `@Body(new ZodValidationPipe(createTodoSchema))`.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const message = result.error.issues
        .map(
          (issue) =>
            `${issue.path.length ? issue.path.join('.') : 'body'}: ${issue.message}`,
        )
        .join('; ');
      throw new BadRequestException(message);
    }
    return result.data;
  }
}
