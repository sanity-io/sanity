import {useEffect, useState, type ReactNode} from 'react'
import {SANITY_VERSION} from '../../version'
import { useToast } from '@sanity/ui'
import { checkForLatestVersions } from './checkForLatestVersions'

interface VersionMap {
  [key: string]: string
}

/*
 * The presence of the sanity module in the importmap script 
 * indicates that the studio was probably built with an auto-updates flag.
 */ 
const hasSanityPackageInImportMap = () => { 
  if (typeof document === 'undefined' || !('querySelectorAll' in document)) {
    return false
  }
  const importMapEntries = document.querySelectorAll('script[type="importmap"]')
  return Array.from(importMapEntries).flatMap((entry) => {
    if (!entry.textContent) return []
    const entryImports = JSON.parse(entry.textContent)
    return Object.keys(entryImports.imports || {})
  }).some((key) => key === 'sanity')
}

export function PackageVersionStatusProvider({children}: {children: ReactNode}) {
  const [latestVersions, setLatestVersions] = useState<VersionMap | null>(null)
  const toast = useToast()
  /*
  * We are currently only checking to see if the sanity module has a new version available.
  * We can add more packages to this list (e.g., @sanity/vision) if we want to check for more.
  */
  const currentPackages = {
    sanity: SANITY_VERSION,
  }
  const autoUpdatingPackages = hasSanityPackageInImportMap()

  console.log('hi from version status provider')


  const onClick = () => {
    window.location.reload()
  }

  useEffect(() => {
    if (!autoUpdatingPackages) return
    const sub = checkForLatestVersions(currentPackages)
      .subscribe({
        next: setLatestVersions as any,
      })

    return () => sub?.unsubscribe()
  }, [setLatestVersions])


  useEffect(() => {
    if (!latestVersions) return

    const latestSanityVersion = latestVersions.sanity

    if (latestSanityVersion && latestSanityVersion !== SANITY_VERSION) {
      toast.push({
        closable: true,
        description: (
          <>
          <>
            A new version of Sanity Studio is available. Please refresh to see everything cool!
          </>
          <br />
          <span onClick={onClick}>
            Reload
          </span>
          </>
        ),
        status: 'info',
        title: 'New version available',
        duration: 10000,
      })
    }
  }, [latestVersions, toast])

  return <>{children}</>
}