import {Box, useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useRef} from 'react'
import semver from 'semver'

import {Button} from '../../../ui-components'
import {hasSanityPackageInImportMap} from '../../environment/hasSanityPackageInImportMap'
import {useTranslation} from '../../i18n'
import {SANITY_VERSION} from '../../version'
import {checkForLatestVersions} from './checkForLatestVersions'

// How often to to check last timestamp. at 30 min, should fetch new version
const REFRESH_INTERVAL = 1000 * 30 // every 30 seconds
const SHOW_TOAST_FREQUENCY = 1000 * 60 * 30 // half hour

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
        <Box paddingTop={2}>
          <Button
            size="large"
            aria-label={t('package-version.new-package-available.reload-button')}
            onClick={onClick}
            text={t('package-version.new-package-available.reload-button')}
            tone={'primary'}
          />
        </Box>
      ),
      closable: true,
      status: 'info',
      /*
       * We want to show the toast until the user closes it.
       * Because of the toast ID, we should never see it twice.
       * https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value
       */
      duration: 1000 * 60 * 60 * 24 * 24,
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
        lastCheckedTimeRef.current = Date.now()

        if (!latestPackageVersions) return

        const foundNewVersion = Object.entries(latestPackageVersions).some(([pkg, version]) => {
          if (!version || !currentPackageVersions[pkg]) return false
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
