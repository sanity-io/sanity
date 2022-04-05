import path from 'path'
import fs from 'fs/promises'

export interface ReaddirItem {
  path: string
  isDir: boolean
}

export async function readdirRecursive(dir: string): Promise<ReaddirItem[]> {
  let content: ReaddirItem[] = []

  const currentPath = path.resolve(dir)
  const dirContent = (await fs.readdir(currentPath)).map((item) => path.join(currentPath, item))

  for (const subPath of dirContent) {
    const stat = await fs.stat(subPath)
    const isDir = stat.isDirectory()
    content.push({path: subPath, isDir})

    if (isDir) {
      content = content.concat(await readdirRecursive(subPath))
    }
  }

  return content
}
