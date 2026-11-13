import {useToast} from '@sanity/ui/toast'
import {Suspense, use, useEffect} from 'react'
import {Box} from 'ui5'

import {Dialog} from '../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../components/loadingBlock/LoadingBlock'
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
 * touches the upsell data; open, it reads the content with `use()` under its own boundary, showing
 * a loading dialog until the content has arrived. The read is synchronous when the provider
 * preloaded the content and it has answered; otherwise opening the dialog starts the request.
 *
 * @internal
 */
export function UpsellContextDialog({contextValue, interpolation}: UpsellContextDialogProps) {
  if (!contextValue.upsellDialogOpen) return null
  return (
    <Suspense fallback={<LoadingUpsellDialog onClose={contextValue.handleClose} />}>
      <OpenUpsellContextDialog contextValue={contextValue} interpolation={interpolation} />
    </Suspense>
  )
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

function LoadingUpsellDialog({onClose}: {onClose: () => void}) {
  return (
    <Dialog
      id="upsell-dialog-loading"
      onClose={onClose}
      onClickOutside={onClose}
      __unstable_hideCloseButton
      padding={false}
      zOffset={800}
    >
      <Box padding={6}>
        <LoadingBlock />
      </Box>
    </Dialog>
  )
}

/**
 * Rendered in place of an upsell dialog whose content request failed: says so with a toast and
 * closes the dialog again, so nothing stays open with nothing in it.
 */
function UpsellContentUnavailable({onClose}: {onClose: () => void}) {
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
