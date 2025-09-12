export interface PackageJSON {
  name: string
  private?: boolean
  version: string
  exports?: Record<string, Record<string, string>>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  engines?: Record<string, string>
  keywords?: string[]
}

export interface PackageInfo {
  path: string
  dirname: string
  repoDir: string
  repoPath: string
  contents: PackageJSON
}
