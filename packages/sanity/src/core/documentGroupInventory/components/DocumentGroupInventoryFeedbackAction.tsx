import {FeedbackIcon} from '@sanity/icons/Feedback'
import {useSelector} from '@xstate/react'

import {Button} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type DocumentGroupInventoryHandle} from './DocumentGroupInventory'

/**
 * @internal
 */
export interface DocumentGroupInventoryFeedbackActionProps {
  /**
   * The inventory machine, read from a {@link DocumentGroupInventoryHandle}. The feedback dialog is
   * rendered by the inventory while the machine is in its `feedback` state.
   */
  inventory: DocumentGroupInventoryHandle['inventory']
}

/**
 * Opens the document group inventory's feedback dialog. Disabled whenever the inventory refuses to
 * begin feedback (in read-only mode, or while another flow, such as variant creation, is active).
 *
 * @internal
 */
export function DocumentGroupInventoryFeedbackAction({
  inventory,
}: DocumentGroupInventoryFeedbackActionProps) {
  const {t} = useTranslation()

  const canBeginFeedback = useSelector(inventory, (snapshot) =>
    snapshot.can({type: 'feedback.begin'}),
  )

  return (
    <Button
      aria-label={t('content-variants.feedback.action')}
      disabled={!canBeginFeedback}
      icon={FeedbackIcon}
      mode="bleed"
      onClick={() => inventory.send({type: 'feedback.begin'})}
      tooltipProps={{content: t('content-variants.feedback.action')}}
    />
  )
}
