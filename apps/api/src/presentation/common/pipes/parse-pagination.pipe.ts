import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/** Pagination query fields as they arrive from the HTTP request (strings). */
export interface PaginationQuery {
  page?: unknown;
  limit?: unknown;
  sortOrder?: unknown;
  [key: string]: unknown;
}

/** Pagination query fields after coercion to their expected types. */
export interface ParsedPaginationQuery {
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

/**
 * Transforms query parameters from strings to their expected types.
 * This is necessary when using intersection types with @Query() decorator,
 * which causes TypeScript metadata to be lost and prevents class-transformer
 * decorators (@Type, @Transform) from applying correctly.
 */
@Injectable()
export class ParsePaginationPipe implements PipeTransform {
  transform(value: PaginationQuery, _metadata: ArgumentMetadata): ParsedPaginationQuery {
    if (!value || typeof value !== 'object') {
      return value as ParsedPaginationQuery;
    }

    const result: ParsedPaginationQuery = {};

    // Copy every property except the ones we coerce below.
    for (const [key, val] of Object.entries(value)) {
      if (key !== 'page' && key !== 'limit' && key !== 'sortOrder') {
        result[key] = val;
      }
    }

    // Coerce numeric fields
    const page = value.page;
    if (page !== undefined && page !== null && page !== '') {
      result.page = Number(page);
    }
    const limit = value.limit;
    if (limit !== undefined && limit !== null && limit !== '') {
      result.limit = Number(limit);
    }

    // Normalize sortOrder
    const sortOrder = value.sortOrder;
    if (sortOrder !== undefined && sortOrder !== null) {
      const val = String(sortOrder).toLowerCase();
      if (val === 'asc' || val === 'desc') {
        result.sortOrder = val;
      } else {
        result.sortOrder = 'desc';
      }
    }

    return result;
  }
}
