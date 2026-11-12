import {useSelector} from '@xstate/react'
import {Text, Button as Ui5Button} from 'ui5'
import {type ActorRefFromLogic} from 'xstate'

import {Button} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {type deletionMachine} from '../machines/deletionMachine'
import {type selectionMachine} from '../machines/selectionMachine'
import {type variantCreationMachine} from '../machines/variantCreationMachine'
import {type DocumentGroupInventoryComponents} from '../types'
import {Header} from './Header'

/**
 * The inventory's header, holding the actions that apply to the document group
 * as a whole. Each action is offered only while its machine accepts it.
 *
 * While at least one version is checked, the header row becomes the action bar:
 * "N selected · Delete · Clear", the same bulk bar the Releases tool's document table shows.
 */
export function InventoryHeader({
  selectionRef,
  deletionRef,
  variantCreationRef,
  components,
}: {
  selectionRef: ActorRefFromLogic<typeof selectionMachine>
  deletionRef: ActorRefFromLogic<typeof deletionMachine>
  variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>
  /** Absent in read-only mode, where the consumer supplies no pane-coupled components. */
  components: DocumentGroupInventoryComponents | undefined
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
      <div className="atom">
        {/* Always mounted, so the count is announced as it changes */}
        <div role="status" aria-live="polite" data-testid="selected-count-status">
          {selectedCount !== 0 && (
            <Text size={1} as="div" trim={true}>
              {t('document-group.selected-count', {count: selectedCount})}
            </Text>
          )}
        </div>
        {canRequestDeletion && (
          <Ui5Button
            // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- button level, not user-facing copy
            level="tertiary"
            tone="critical"
            text={t('document-group.delete.confirm-button.text')}
            onClick={() => deletionRef.send({type: 'delete.request'})}
          />
        )}
      </div>
      {selectedCount === 0 ? (
        <div className="atom">
          {components && <components.CompareVersionsAction />}
          {canCreateVariant && (
            <Button
              text={t('document-group.create-variant.open-button.text')}
              onClick={() => variantCreationRef.send({type: 'createVariant.request'})}
            />
          )}
        </div>
      ) : (
        <div className="atom">
          <Ui5Button
            // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- button level, not user-facing copy
            level="tertiary"
            text={t('document-group.clear-selection')}
            onClick={() => selectionRef.send({type: 'selection.clear'})}
          />
        </div>
      )}
    </Header>
  )
}
