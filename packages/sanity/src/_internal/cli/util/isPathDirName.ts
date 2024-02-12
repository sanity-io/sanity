function isPathDirName(filepath: string): boolean {
  // Check if the path has an extension, commonly indicating a file
  return !/\.\w+$/.test(filepath)
}

export default isPathDirName
