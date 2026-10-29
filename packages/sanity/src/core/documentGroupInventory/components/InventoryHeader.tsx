import {useSelector} from '@xstate/react'
import {type ActorRefFromLogic} from 'xstate'

import {Button} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {type variantCreationMachine} from '../machines/variantCreationMachine'
import {Header} from './Header'

/**
 * The inventory's header, holding the actions that apply to the document group
 * as a whole. Each action is offered only while its machine accepts it.
 */
export function InventoryHeader({
  variantCreationRef,
}: {
  variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>
}) {
  const {t} = useTranslation(studioLocaleNamespace)

  const canCreateVariant = useSelector(variantCreationRef, (machine) =>
    machine.can({type: 'createVariant.request'}),
  )

  return (
    <Header>
      {canCreateVariant && (
        <Button
          text={t('document-group.create-variant')}
          onClick={() => variantCreationRef.send({type: 'createVariant.request'})}
        />
      )}
    </Header>
  )
}
