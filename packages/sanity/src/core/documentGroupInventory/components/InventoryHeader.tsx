import {Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {Button as Ui5Button} from 'ui5'
import {type ActorRefFromLogic} from 'xstate'

import {Button} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {type deletionMachine} from '../machines/deletionMachine'
import {type selectionMachine} from '../machines/selectionMachine'
import {type variantCreationMachine} from '../machines/variantCreationMachine'
import {Header} from './Header'

/**
 * The inventory's header, holding the actions that apply to the document group
 * as a whole. Each action is offered only while its machine accepts it.
 */
export function InventoryHeader({
  selectionRef,
  deletionRef,
  variantCreationRef,
}: {
  selectionRef: ActorRefFromLogic<typeof selectionMachine>
  deletionRef: ActorRefFromLogic<typeof deletionMachine>
  variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>
}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const selectedCount = useSelector(selectionRef, ({context}) => context.selectedIds.size)

  const canRequestDeletion = useSelector(deletionRef, (machine) =>
    machine.can({type: 'delete.request'}),
  )

  const canCreateVariant = useSelector(variantCreationRef, (machine) =>
    machine.can({type: 'createVariant.request'}),
  )

  return (
    <Header>
      {selectedCount !== 0 && (
        <Text size={1}>{t('document-group.selected-count', {count: selectedCount})}</Text>
      )}
      {canRequestDeletion && (
        <Ui5Button
          // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- button level, not user-facing copy
          level="tertiary"
          tone="critical"
          text={t('document-group.delete.confirm-button.text')}
          onClick={() => deletionRef.send({type: 'delete.request'})}
        />
      )}
      {canCreateVariant && (
        <Button
          text={t('document-group.create-variant')}
          onClick={() => variantCreationRef.send({type: 'createVariant.request'})}
        />
      )}
    </Header>
  )
}
