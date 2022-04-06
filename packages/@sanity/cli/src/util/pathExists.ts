import fs from 'fs/promises'

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false
    }

    throw err
  }
}
