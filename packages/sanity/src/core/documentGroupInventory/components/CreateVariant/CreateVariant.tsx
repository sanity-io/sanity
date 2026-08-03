import {useSelector} from '@xstate/react'
import {type ComponentType} from 'react'
import {type ActorRefFromLogic} from 'xstate'

import {type selectionMachine} from '../../machines/selectionMachine'
import {type variantCreationMachine} from '../../machines/variantCreationMachine'
import {SelectBundle} from './SelectBundle'
import {SelectVariantDefinition} from './SelectVariantDefinition'

interface Props {
  variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>
  selectionRef: ActorRefFromLogic<typeof selectionMachine>
}

export const CreateVariant: ComponentType<Props> = ({variantCreationRef, selectionRef}) => {
  const hasSelectedVariantId = useSelector(
    variantCreationRef,
    ({context}) => typeof context.selectedVariantId !== 'undefined',
  )

  const hasSelectedBundle = useSelector(
    variantCreationRef,
    ({context}) => typeof context.selectedBundle !== 'undefined',
  )

  return (
    <>
      {!hasSelectedVariantId && !hasSelectedBundle && (
        <SelectVariantDefinition variantCreationRef={variantCreationRef} />
      )}
      {hasSelectedVariantId && (
        <SelectBundle variantCreationRef={variantCreationRef} selectionRef={selectionRef} />
      )}
    </>
  )
}
