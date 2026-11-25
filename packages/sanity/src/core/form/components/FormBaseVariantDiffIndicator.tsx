import {type ComponentType, lazy, Suspense, useState} from 'react'

import {type BaseFieldProps} from '../types/fieldProps'

const FormBaseVariantDiffIndicatorPresence = lazy(
  () => import('./FormBaseVariantDiffIndicatorPresence'),
)

type Props = Pick<BaseFieldProps, 'changedFromBaseVariant'>

export const FormBaseVariantDiffIndicator: ComponentType<Props> = ({changedFromBaseVariant}) => {
  // The indicator stays mounted once shown, so it can fade out
  const [hasChanged, setHasChanged] = useState(changedFromBaseVariant)
  if (changedFromBaseVariant && !hasChanged) {
    setHasChanged(true)
  }

  if (!hasChanged) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <FormBaseVariantDiffIndicatorPresence changedFromBaseVariant={changedFromBaseVariant} />
    </Suspense>
  )
}
