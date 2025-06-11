/**
 * Replaces all slashes with double underscores
 */
export function cleanDirName(dirName: string) {
  return dirName.replace(/\//g, '__')
}
