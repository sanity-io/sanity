import {useRouter} from 'sanity/router'

import {VariantDetail} from './detail/VariantDetail'
import {VariantsOverview} from './overview/VariantsOverview'

export function VariantsTool() {
  const router = useRouter()
  const variantId = typeof router.state.variantId === 'string' ? router.state.variantId : undefined

  if (variantId) {
    return <VariantDetail key={variantId} />
  }

  return <VariantsOverview />
}
