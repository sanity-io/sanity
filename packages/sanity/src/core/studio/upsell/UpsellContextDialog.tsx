import {useToast} from '@sanity/ui/toast'
import {use, useEffect} from 'react'

import {type UpsellContextValue} from '../../hooks/useUpsellContext'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type InterpolationProp} from './upsellDescriptionSerializer/UpsellDescriptionSerializer'
import {UpsellDialog} from './UpsellDialog'

interface UpsellContextDialogProps {
  contextValue: UpsellContextValue
  /**
   * Values for `{{placeholders}}` in the dialog copy. Omitted, the copy is rendered as authored.
   */
  interpolation?: InterpolationProp
}

/**
 * The `UpsellDialog` of a `useUpsellContext` provider. Closed, it renders nothing and never
 * touches the upsell data; open, it reads the content with `use()`, so render it under a
 * `Suspense` boundary next to the provider's children (the request started when the provider
 * committed, so the read is synchronous unless the dialog is opened before it has answered).
 *
 * @internal
 */
export function UpsellContextDialog({contextValue, interpolation}: UpsellContextDialogProps) {
  if (!contextValue.upsellDialogOpen) return null
  return <OpenUpsellContextDialog contextValue={contextValue} interpolation={interpolation} />
}

function OpenUpsellContextDialog({contextValue, interpolation}: UpsellContextDialogProps) {
  const {handleClose, telemetryLogs, upsellDataPromise} = contextValue
  const {upsellData} = use(upsellDataPromise)

  if (!upsellData) return <UpsellContentUnavailable onClose={handleClose} />
  return (
    <UpsellDialog
      data={upsellData}
      interpolation={interpolation}
      onClose={handleClose}
      onPrimaryClick={telemetryLogs.dialogPrimaryClicked}
      onSecondaryClick={telemetryLogs.dialogSecondaryClicked}
    />
  )
}

/**
 * Rendered in place of an upsell dialog whose content request failed: says so with a toast and
 * closes the dialog again, so nothing stays open with nothing in it.
 *
 * @internal
 */
export function UpsellContentUnavailable({onClose}: {onClose: () => void}) {
  const toast = useToast()
  const {t} = useTranslation()

  useEffect(() => {
    toast.push({
      status: 'error',
      title: t('errors.unable-to-perform-action'),
      closable: true,
    })
    onClose()
  }, [onClose, t, toast])

  return null
}
