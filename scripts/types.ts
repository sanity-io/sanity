export interface PackageManifest {
  name: string
  version: string
  exports?: Record<string, string | Record<string, string>>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  engines?: Record<string, string>
  keywords?: string[]
}

export interface Package {
  path: string
  dirname: string
  manifest: PackageManifest
}
