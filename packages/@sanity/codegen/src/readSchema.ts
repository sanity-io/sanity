import {readFile} from 'fs/promises'
import {type Schema} from 'groq-js/typeEvaluator'

export async function readSchema(path: string): Promise<Schema> {
  const content = await readFile(path, 'utf-8')
  return JSON.parse(content) // todo: ZOD validation?
}
