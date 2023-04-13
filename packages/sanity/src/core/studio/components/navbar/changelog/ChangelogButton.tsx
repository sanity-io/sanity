import React, {useCallback, useMemo, useState} from 'react'
import {PackageIcon} from '@sanity/icons'
import {DialogProps} from '@sanity/ui'
import {isDev} from '../../../../environment'
import {useClient} from '../../../../hooks'
import {useColorScheme} from '../../../colorScheme'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {StatusButton} from '../../../../components'
import {useModuleStatus} from './module-status'
import {ChangelogDialog} from './ChangelogDialog'
import {ChangelogAccordion} from './ChangelogAccordion'

const EMPTY_ARRAY: [] = []

export function ChangelogButton() {
  const [open, setOpen] = useState<boolean>(false)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const versionedClient = useMemo(
    () =>
      client.withConfig({
        apiVersion: '1',
      }),
    [client]
  )

  // get root scheme
  const {scheme} = useColorScheme()

  const {value, error, isLoading} = useModuleStatus({
    client: versionedClient,
  })

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
      footer: <ChangelogAccordion defaultOpen={isDev} />,
      onClickOutside: handleClose,
      onClose: handleClose,
      // force root scheme here to "break out" of the navbar's dark scheme
      scheme,
    }),
    [handleClose, scheme]
  )

  if (error || isLoading || isUpToDate) {
    return null
  }

  return (
    <>
      <StatusButton
        icon={PackageIcon}
        label="Upgrade the Sanity Studio"
        mode="bleed"
        onClick={handleOpen}
        ref={setButtonElement}
        selected={open}
        tooltip={{scheme}}
        tone="primary"
      />

      {open && (
        <ChangelogDialog
          changelog={changelog || EMPTY_ARRAY}
          currentVersion={currentVersion}
          dialogProps={dialogProps}
          latestVersion={latestVersion}
        />
      )}
    </>
  )
}
