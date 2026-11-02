import {use} from 'react'
import {useRouter} from 'sanity/router'

import {useVariantsMode} from '../contexts/mode/useVariantsMode'
import {VariantDetail} from './detail/VariantDetail'
import {VariantsOverview} from './overview/VariantsOverview'
import {VariantsUpsellOverview} from './upsell/VariantsUpsellOverview'

export default function VariantsTool() {
  const router = useRouter()
  // Suspends up to the tool's own loading block until the content variants check has answered, so
  // the tool never renders the wrong page first
  const mode = use(useVariantsMode())
  const variantId = typeof router.state.variantId === 'string' ? router.state.variantId : undefined

  if (mode !== 'default') {
    return <VariantsUpsellOverview mode={mode} />
  }

  if (variantId) {
    return <VariantDetail key={variantId} />
  }

  return <VariantsOverview />
}
