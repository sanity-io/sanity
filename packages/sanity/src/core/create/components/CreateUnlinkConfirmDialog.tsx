import {Stack, Text} from '@sanity/ui'
import {useCallback, useId, useState} from 'react'

import {Dialog} from '../../../ui-components/dialog/Dialog'
import {PatchEvent} from '../../form/patch/PatchEvent'
import {unset} from '../../form/patch/patch'
import {Translate} from '../../i18n/Translate'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {createLocaleNamespace} from '../i18n'
import {useSanityCreateTelemetry} from '../useSanityCreateTelemetry'

export interface CreateUnlinkConfirmDialogProps {
  onClose: () => void
  onDocumentChange: (patchEvent: PatchEvent) => void
  documentTitle?: string
}

export function CreateUnlinkConfirmDialog(props: CreateUnlinkConfirmDialogProps) {
  const {onClose, onDocumentChange, documentTitle} = props
  const id = useId()
  const [unlinking, setUnlinking] = useState(false)
  const {t} = useTranslation(createLocaleNamespace)
  const telemetry = useSanityCreateTelemetry()

  const unlink = useCallback(() => {
    setUnlinking(true)
    onDocumentChange(PatchEvent.from(unset(['_create'])))
    telemetry.unlinkApproved()
    // on not calling onClose:
    // when this mutation propagates down the render tree again, this dialog will me unmounted;
    // the code-path leading here will no longer be rendered
  }, [onDocumentChange, telemetry])

  return (
    <Dialog
      footer={{
        cancelButton: {
          onClick: onClose,
          text: t('unlink-from-create-dialog.cancel.text'),
        },
        confirmButton: {
          disabled: unlinking,
          onClick: unlink,
          text: t('unlink-from-create-dialog.unlink.text'),
          tone: 'primary',
        },
      }}
      id={id}
      header={t('unlink-from-create-dialog.header')}
      onClose={onClose}
    >
      <Stack space={4}>
        <Text size={1}>
          <Translate
            t={t}
            i18nKey="unlink-from-create-dialog.first-paragraph"
            values={{title: documentTitle || t('unlink-from-create-dialog.document.untitled.text')}}
          />
        </Text>

        <Text size={1}>{t('unlink-from-create-dialog.second-paragraph')}</Text>
      </Stack>
    </Dialog>
  )
}
