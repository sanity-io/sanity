import {readFile} from 'node:fs/promises'

import {type SchemaType} from 'groq-js'

/**
 * Read a schema from a given path
 * @param path - The path to the schema
 * @returns The schema
 * @internal
 * @beta
 **/
export async function readSchema(path: string): Promise<SchemaType> {
  const content = await readFile(path, 'utf-8')
  return JSON.parse(content) // todo: ZOD validation?
}
