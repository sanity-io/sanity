import React, {useCallback, useMemo, useState} from 'react'
import {useModuleStatus} from '@sanity/base/hooks'
import {PackageIcon} from '@sanity/icons'
import {DialogProps, useGlobalKeyDown} from '@sanity/ui'
import {ChangelogDialog, UpgradeAccordion} from '../../update'
import {StatusButton} from '../components'

declare const __DEV__: boolean

export function ChangelogContainer() {
  const [open, setOpen] = useState<boolean>(false)
  const {value, error, isLoading} = useModuleStatus()
  const {changelog, currentVersion, latestVersion, isUpToDate} = value || {}

  const handleToggleOpen = useCallback(() => setOpen((v) => !v), [])

  useGlobalKeyDown(
    useCallback(
      (e) => {
        if (e.key === 'Escape' && open) {
          setOpen(false)
        }
      },
      [open]
    )
  )

  const dialogProps: Omit<DialogProps, 'id'> = useMemo(
    () => ({
      footer: <UpgradeAccordion defaultOpen={__DEV__} />,
      onClickOutside: handleToggleOpen,
      onClose: handleToggleOpen,
      scheme: 'light',
    }),
    [handleToggleOpen]
  )

  if (error || isLoading || isUpToDate) {
    return null
  }

  return (
    <>
      <StatusButton
        icon={PackageIcon}
        mode="bleed"
        onClick={handleToggleOpen}
        selected={open}
        statusTone="primary"
      />
      {open && (
        <ChangelogDialog
          dialogProps={dialogProps}
          changelog={changelog}
          currentVersion={currentVersion}
          latestVersion={latestVersion}
        />
      )}
    </>
  )
}
