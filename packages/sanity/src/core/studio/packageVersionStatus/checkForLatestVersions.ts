// object like {sanity: '3.40.1'}
interface VersionMap {
  [key: string]: string | undefined
}

// @ts-expect-error: __SANITY_STAGING__ is a global env variable set by the vite config
const isStaging = typeof __SANITY_STAGING__ !== 'undefined' && __SANITY_STAGING__ === true

// e2e tests also check for this URL pattern -- please update if it changes!
const MODULES_URL_VERSION = 'v1'
const MODULES_HOST = isStaging ? 'https://sanity-cdn.work' : 'https://sanity-cdn.com'
const MODULES_URL = `${MODULES_HOST}/${MODULES_URL_VERSION}/modules/`

const fetchLatestVersionForPackage = async (pkg: string, version: string) => {
  try {
    // On every request it should be a new timestamp, so we can actually get a new version notification
    const timestamp = `t${Math.floor(Date.now() / 1000)}`
    const res = await fetch(`${MODULES_URL}${pkg}/default/^${version}/${timestamp}`, {
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
  const results = await Promise.all(
    Object.entries(packages).map(async ([pkg, version]) => [
      pkg,
      await fetchLatestVersionForPackage(pkg, version),
    ]),
  )
  const packageVersions: VersionMap = Object.fromEntries(results)
  return packageVersions
}
