import {use} from 'react'
import {PackageVersionInfoContext} from 'sanity/_singletons'

export function usePackageVersionStatus() {
  return use(PackageVersionInfoContext)
}
