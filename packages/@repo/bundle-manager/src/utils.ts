/**
 * Replaces all slashes with double underscores
 */
export function cleanDirName(dirName: string) {
  return dirName.replace(/\//g, '__')
}

export function currentUnixTime() {
  return Math.floor(Date.now() / 1000)
}
