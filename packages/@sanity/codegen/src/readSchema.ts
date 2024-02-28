import {readFile} from 'fs/promises'
import {type SchemaType} from 'groq-js'

export async function readSchema(path: string): Promise<SchemaType> {
  const content = await readFile(path, 'utf-8')
  return JSON.parse(content) // todo: ZOD validation?
}
