import {ConfirmPopover} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'

interface RevertChangesConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  changeCount: number
  referenceElement: HTMLElement | null
}

/**
 * @internal
 */
export function RevertChangesConfirmDialog({
  open,
  onConfirm,
  onCancel,
  changeCount,
  referenceElement,
}: RevertChangesConfirmDialogProps) {
  const {t} = useTranslation()

  return (
    <ConfirmPopover
      cancelButtonText={t('changes.action.revert-all-cancel')}
      confirmButtonText={
        changeCount > 1
          ? t('changes.action.revert-all-confirm')
          : t('changes.action.revert-changes-confirm-change', {count: 1})
      }
      message={
        changeCount > 1
          ? t('changes.action.revert-all-description', {count: changeCount})
          : t('changes.action.revert-changes-description', {count: changeCount})
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={open}
      referenceElement={referenceElement}
      tone="critical"
      placement="bottom"
      fallbackPlacements={['bottom', 'bottom-start', 'bottom-end']}
    />
  )
}
