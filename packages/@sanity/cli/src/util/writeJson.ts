import {writeFile} from 'node:fs/promises'

export function writeJson(filePath: string, content: unknown): Promise<void> {
  const serialized = JSON.stringify(content, null, 2)
  return writeFile(filePath, serialized, 'utf8')
}
