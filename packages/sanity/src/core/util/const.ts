/**
 * Maximum size in bytes for document IDs in a single query.
 * This matches the limit used in availability.ts and accounts for
 * the Sanity client's max query size with room for headers.
 */
export const MAX_DOCUMENT_ID_CHUNK_SIZE = 11164
