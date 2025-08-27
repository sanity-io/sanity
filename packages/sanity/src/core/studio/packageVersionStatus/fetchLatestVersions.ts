const isStaging = process.env.SANITY_INTERNAL_ENV === 'staging'

// e2e tests also check for this URL pattern -- please update if it changes!
const MODULES_URL_VERSION = 'v1'
const MODULES_HOST = isStaging ? 'https://sanity-cdn.work' : 'https://sanity-cdn.com'
const MODULES_URL = `${MODULES_HOST}/${MODULES_URL_VERSION}/modules/`

export const fetchLatestVersionForPackage = async (
  pkg: string,
  version: string,
  tag = 'default',
) => {
  try {
    // On every request it should be a new timestamp, so we can actually get a new version notification
    const timestamp = `t${Math.floor(Date.now() / 1000)}`
    const res = await fetch(`${MODULES_URL}${pkg}/${tag}/^${version}/${timestamp}`, {
      headers: {
        accept: 'application/json',
      },
    })
    return res.json().then((data): string => data.packageVersion)
  } catch (err) {
    console.error(`Failed to fetch version for package (using tag=${tag})`, pkg, 'Error:', err)
    return undefined
  }
}
