import {Box, Button, Stack, useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useRef} from 'react'
import {SANITY_VERSION} from 'sanity'
import semver from 'semver'

import {hasSanityPackageInImportMap} from '../../environment/hasSanityPackageInImportMap'
import {useTranslation} from '../../i18n'
import {checkForLatestVersions} from './checkForLatestVersions'

// How often to run logic to check last timestamp and fetch new version
const REFRESH_INTERVAL = 1000 * 60 * 5 // every 5 minutes
const SHOW_TOAST_FREQUENCY = 1000 * 60 * 30 //half hour

/*
 * We are currently only checking to see if the sanity module has a new version available.
 * We can add more packages to this list (e.g., @sanity/vision) if we want to check for more.
 */
const currentPackageVersions: Record<string, string> = {
  sanity: SANITY_VERSION,
}

export function PackageVersionStatusProvider({children}: {children: ReactNode}) {
  const toast = useToast()
  const {t} = useTranslation()
  const lastCheckedTimeRef = useRef<number | null>(null)

  const autoUpdatingPackages = hasSanityPackageInImportMap()

  const showNewPackageAvailableToast = useCallback(() => {
    const onClick = () => {
      window.location.reload()
    }

    toast.push({
      id: 'new-package-available',
      title: t('package-version.new-package-available.title'),
      description: (
        <Stack space={2} paddingBottom={2}>
          <Box>{t('package-version.new-package-available.description')}</Box>
          <Box>
            <Button
              aria-label={t('package-version.new-package-available.reload-button')}
              onClick={onClick}
              text={t('package-version.new-package-available.reload-button')}
              tone={'primary'}
            />
          </Box>
        </Stack>
      ),
      closable: true,
      status: 'info',
      duration: SHOW_TOAST_FREQUENCY + 10000, //covering for some delays, etc.
    })
  }, [toast, t])

  useEffect(() => {
    if (!autoUpdatingPackages) return undefined

    const fetchLatestVersions = () => {
      if (
        lastCheckedTimeRef.current &&
        lastCheckedTimeRef.current + SHOW_TOAST_FREQUENCY > Date.now()
      ) {
        return
      }

      checkForLatestVersions(currentPackageVersions).then((latestPackageVersions) => {
        if (!latestPackageVersions) return

        const currentTime = Date.now()
        lastCheckedTimeRef.current = currentTime

        const foundNewVersion = Object.entries(latestPackageVersions).some(([pkg, version]) => {
          if (!version) return false
          return semver.gt(version, currentPackageVersions[pkg])
        })

        if (foundNewVersion) {
          showNewPackageAvailableToast()
        }
      })
    }

    // Run on first render
    fetchLatestVersions()

    // Set interval for subsequent runs
    const intervalId = setInterval(fetchLatestVersions, REFRESH_INTERVAL)

    return () => clearInterval(intervalId)
  }, [autoUpdatingPackages, showNewPackageAvailableToast])

  return <>{children}</>
}
