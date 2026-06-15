import {Card} from '@sanity/ui'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {useAllVariants} from '../../store/useAllVariants'
import {decodeVariantIdFromRoute} from '../../tool/util'
import {CurrentVariantLabel} from './CurrentVariantLabel'
import {VariantsMenu} from './VariantsMenu'

const VariantsNavContainer = styled(Card)`
  position: relative;
  display: flex;
  &:not([hidden]) {
    display: flex;
  }
  align-items: center;
  gap: 2px;
  padding: 2px;
  margin: -3px 0;

  a:hover,
  button:hover {
    position: relative;
    z-index: 2;
  }
`

/**
 * @internal
 */
export function VariantsNav(): React.JSX.Element {
  const router = useRouter()
  const {byId} = useAllVariants()

  const selectedVariantDocumentId = decodeVariantIdFromRoute(
    router.stickyParams.variant ?? undefined,
  )

  const selectedVariant = selectedVariantDocumentId
    ? byId.get(selectedVariantDocumentId)
    : undefined

  return (
    <VariantsNavContainer flex="none" tone="inherit" radius="full" data-ui="VariantsNav">
      <CurrentVariantLabel selectedVariant={selectedVariant} />
      <VariantsMenu />
    </VariantsNavContainer>
  )
}
