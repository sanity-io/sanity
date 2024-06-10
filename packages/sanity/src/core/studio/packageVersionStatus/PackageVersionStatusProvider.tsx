import {Box, Button, Stack, useToast} from '@sanity/ui'
import {type ReactNode, useEffect, useState} from 'react'
import {SANITY_VERSION} from 'sanity'
import semver from 'semver'

import {hasSanityPackageInImportMap} from '../../environment/hasSanityPackageInImportMap'
import {useTranslation} from '../../i18n'
import {checkForLatestVersions} from './checkForLatestVersions'

/*
 * We are currently only checking to see if the sanity module has a new version available.
 * We can add more packages to this list (e.g., @sanity/vision) if we want to check for more.
 */
const currentPackageVersions: Record<string, string> = {
  sanity: SANITY_VERSION,
}

export function PackageVersionStatusProvider({children}: {children: ReactNode}) {
  const [hasNewVersion, setHasNewVersion] = useState<boolean>(false)
  const toast = useToast()
  const {t} = useTranslation()

  const autoUpdatingPackages = hasSanityPackageInImportMap()

  const onClick = () => {
    window.location.reload()
  }

  useEffect(() => {
    const sub = checkForLatestVersions(currentPackageVersions).subscribe({
      next: (latestPackageVersions) => {
        const foundNewVersion = Object.entries(latestPackageVersions).some(([pkg, version]) => {
          if (!version) return false
          return semver.gt(version, currentPackageVersions[pkg])
        })
        setHasNewVersion(foundNewVersion)
      },
    })
    return () => sub?.unsubscribe()
  }, [setHasNewVersion, autoUpdatingPackages])

  useEffect(() => {
    if (autoUpdatingPackages && hasNewVersion) {
      toast.push({
        id: 'new-package-available',
        title: t('package-version.new-package-available.title'),
        description: (
          <Stack space={2} paddingBottom={2}>
            <Box>{t('package-version.new-package-available.description')}</Box>
            <Box>
              <Button
                onClick={onClick}
                aria-label={t('package-version.new-package-available.reload-button')}
                tone={'primary'}
                text={t('package-version.new-package-available.reload-button')}
              />
            </Box>
          </Stack>
        ),
        closable: true,
        duration: 10000,
        status: 'info',
      })
    }
  }, [hasNewVersion, toast, t, autoUpdatingPackages])

  return <>{children}</>
}
