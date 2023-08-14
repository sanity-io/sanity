export interface PackageManifest {
  name: string
  private?: boolean
  version: string
  exports?: Record<string, Record<string, string>>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  engines?: Record<string, string>
  keywords?: string[]
}

export interface Package {
  path: string
  dirname: string
  relativeDir: string
  manifest: PackageManifest
}
