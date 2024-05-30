import {map, type Observable, ReplaySubject, timer, from} from 'rxjs'
import {share, switchMap} from 'rxjs/operators'
import { SANITY_VERSION } from 'sanity'

// How often to check for a version
const REFRESH_INTERVAL = 1000 * 20

//reset the observable when it completes or when it has no refcount
const RESET_TIMER = timer(REFRESH_INTERVAL)

const MODULES_VERSION = 'v1'

const MODULES_URL = `https://sanity-cdn.work/${MODULES_VERSION}/modules/`

//object like {sanity: '3.40.1'}
interface VersionMap {
  [key: string]: string
}

const fetchLatestVersionForPackage = async (pkg: string, version: string) => {
  try {
    const res = await fetch(`${MODULES_URL}${pkg}/default/^${version}`, {method: 'HEAD', redirect: 'manual'})
    return res.headers.get('x-resolved-version') || 'latest'
  } catch {
    return 'latest'
  }
}

export const checkForLatestVersions = (packages: VersionMap): Observable<VersionMap> => {
  const packageNames = Object.keys(packages)
  return timer(0, REFRESH_INTERVAL).pipe(
    switchMap(() =>
      from(
        Promise.all(packageNames.map((pkg) => fetchLatestVersionForPackage(pkg, packages[pkg])))
      ).pipe(
        map(results => {
          const packageVersions: VersionMap = {}
          packageNames.forEach((pkg, index) => {
            packageVersions[pkg] = results[index]
          })
          return packageVersions
        })
      )
    ),
    share({
      connector: () => new ReplaySubject(1),
      resetOnComplete: () => RESET_TIMER,
      resetOnRefCountZero: () => RESET_TIMER,
    })
  )
}