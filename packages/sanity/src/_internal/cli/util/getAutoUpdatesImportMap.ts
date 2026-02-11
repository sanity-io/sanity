const MODULES_HOST =
  process.env.SANITY_MODULES_HOST ||
  (process.env.SANITY_INTERNAL_ENV === 'staging'
    ? 'https://sanity-cdn.work'
    : 'https://sanity-cdn.com')

function currentUnixTime(): number {
  return Math.floor(Date.now() / 1000)
}

type Package = {version: string; name: string}
/**
 * @internal
 */
export function getAutoUpdatesImportMap<const Pkg extends Package>(
  packages: Pkg[],
  options: {timestamp?: number; baseUrl?: string; appId?: string} = {},
) {
  return Object.fromEntries(
    packages.flatMap((pkg) => getAppAutoUpdateImportMapForPackage(pkg, options)),
  ) as {[K in Pkg['name'] | `${Pkg['name']}/`]: string}
}

function getAppAutoUpdateImportMapForPackage<const Pkg extends Package>(
  pkg: Pkg,
  options: {timestamp?: number; baseUrl?: string; appId?: string} = {},
): [[Pkg['name'], string], [`${Pkg['name']}/`, string]] {
  const moduleUrl = getModuleUrl(pkg, options)

  return [
    [pkg.name, moduleUrl],
    [`${pkg.name}/`, `${moduleUrl}/`],
  ]
}

export function getModuleUrl(
  pkg: Package,
  options: {timestamp?: number; baseUrl?: string; appId?: string} = {},
) {
  const {timestamp = currentUnixTime()} = options
  return options.appId
    ? getByAppModuleUrl(pkg, {appId: options.appId, baseUrl: options.baseUrl, timestamp})
    : getLegacyModuleUrl(pkg, {timestamp, baseUrl: options.baseUrl})
}

function getLegacyModuleUrl(pkg: Package, options: {timestamp: number; baseUrl?: string}) {
  const encodedMinVer = encodeURIComponent(`^${pkg.version}`)
  return `${options.baseUrl || MODULES_HOST}/v1/modules/${rewriteScopedPackage(pkg.name)}/default/${encodedMinVer}/t${options.timestamp}`
}

function getByAppModuleUrl(
  pkg: Package,
  options: {appId: string; baseUrl?: string; timestamp: number},
) {
  const encodedMinVer = encodeURIComponent(`^${pkg.version}`)
  return `${options.baseUrl || MODULES_HOST}/v1/modules/by-app/${options.appId}/t${options.timestamp}/${encodedMinVer}/${rewriteScopedPackage(pkg.name)}`
}

/**
 * replaces '/' with '__' similar to how eg `@types/scope__pkg` are rewritten
 * scoped packages are stored this way both in the manifest and in the cloud storage bucket
 */
function rewriteScopedPackage(pkgName: string) {
  if (!pkgName.includes('@')) {
    return pkgName
  }
  const [scope, ...pkg] = pkgName.split('/')
  return `${scope}__${pkg.join('')}`
}
