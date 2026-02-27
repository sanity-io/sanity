import open from 'open'

export async function browse(url: string): Promise<void> {
  await open(url)
}
