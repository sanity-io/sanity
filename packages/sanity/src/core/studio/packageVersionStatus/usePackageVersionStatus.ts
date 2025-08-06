import {useContext} from 'react'
import {PackageVersionInfoContext} from 'sanity/_singletons'

export function usePackageVersionStatus() {
  return useContext(PackageVersionInfoContext)
}
