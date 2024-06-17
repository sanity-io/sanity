//object like {sanity: '3.40.1'}
interface VersionMap {
  [key: string]: string | undefined
}

const MODULES_URL_VERSION = 'v1'

const MODULES_HOST =
  process.env.SANITY_INTERNAL_ENV === 'staging'
    ? 'https://sanity-cdn.work'
    : 'https://sanity-cdn.com'

const MODULES_URL = `${MODULES_HOST}/${MODULES_URL_VERSION}/modules/`

const fetchLatestVersionForPackage = async (pkg: string, version: string) => {
  try {
    const res = await fetch(`${MODULES_URL}${pkg}/default/^${version}`, {
      headers: {
        accept: 'application/json',
      },
    })
    return res.json().then((data) => data.packageVersion)
  } catch (err) {
    console.error('Failed to fetch latest version for package', pkg, 'Error:', err)
    return undefined
  }
}

/*
 *
 */
export const checkForLatestVersions = async (
  packages: Record<string, string>,
): Promise<VersionMap | undefined> => {
  const packageNames = Object.keys(packages)

  const results = await Promise.all(
    Object.entries(packages).map(async ([pkg, version]) => [
      pkg,
      await fetchLatestVersionForPackage(pkg, version),
    ]),
  )
  const packageVersions: VersionMap = Object.fromEntries(results)
  return packageVersions
}
