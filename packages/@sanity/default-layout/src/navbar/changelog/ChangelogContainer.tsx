import React, {useCallback, useMemo, useState} from 'react'
import {useModuleStatus} from '@sanity/base/hooks'
import {PackageIcon} from '@sanity/icons'
import {DialogProps} from '@sanity/ui'
import {useSource} from '@sanity/base'
import {ChangelogDialog, UpgradeAccordion} from '../../update'
import {StatusButton} from '../components'

declare const __DEV__: boolean

export function ChangelogContainer() {
  const [open, setOpen] = useState<boolean>(false)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const {client} = useSource()
  const {value, error, isLoading} = useModuleStatus({client})
  const {changelog, currentVersion, latestVersion, isUpToDate} = value || {}

  const handleOpen = useCallback(() => setOpen(true), [])

  const handleClose = useCallback(() => {
    setOpen(false)

    if (buttonElement) {
      buttonElement.focus()
    }
  }, [buttonElement])

  const dialogProps: Omit<DialogProps, 'id'> = useMemo(
    () => ({
      footer: <UpgradeAccordion defaultOpen={__DEV__} />,
      onClickOutside: handleClose,
      onClose: handleClose,
      scheme: 'light',
    }),
    [handleClose]
  )

  if (error || isLoading || isUpToDate) {
    return null
  }

  return (
    <>
      <StatusButton
        icon={PackageIcon}
        mode="bleed"
        onClick={handleOpen}
        ref={setButtonElement}
        selected={open}
        statusTone="primary"
      />
      {open && (
        <ChangelogDialog
          changelog={changelog}
          currentVersion={currentVersion}
          dialogProps={dialogProps}
          latestVersion={latestVersion}
        />
      )}
    </>
  )
}
