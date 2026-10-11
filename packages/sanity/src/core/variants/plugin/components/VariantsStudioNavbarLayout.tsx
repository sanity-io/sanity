import {Card, Spinner} from '@sanity/ui'
import {lazy, Suspense, useMemo} from 'react'
import {useRouter} from 'sanity/router'
import {Flex} from 'ui5'

import {type NavbarProps} from '../../../config/studio/types'
import {parseVariantStickyParam} from '../../util/variantSelection'

const VariantsStudioNavbar = lazy(() => import('./VariantsStudioNavbar'))

// The height of a PerspectiveFilter pill: a default-size Button (9px text box, 8px padding on
// each side) inside a Card with 1px borders. Reserving it keeps the bar from jumping when the
// filters replace the fallback (`VariantsStudioNavbarLayout.browser.test.tsx` measures both).
const FILTER_HEIGHT = '27px'

/**
 * What the bar shows while the filters' chunk loads: one row of a filter pill's height, so the
 * filters replace it without moving the layout below.
 * @internal
 */
export function VariantsStudioNavbarFallback() {
  return (
    <Flex alignItems="center" height={FILTER_HEIGHT}>
      <Spinner muted />
    </Flex>
  )
}

export default function VariantsStudioNavbarLayout(props: NavbarProps) {
  const router = useRouter()
  const variantSelections = useMemo(
    () =>
      parseVariantStickyParam(
        typeof router.stickyParams.variant === 'string' ? router.stickyParams.variant : undefined,
      ),
    [router.stickyParams.variant],
  )
  return (
    <Flex flexDirection="column">
      {props.renderDefault(props)}
      <Card
        tone={variantSelections.length > 0 ? 'suggest' : 'neutral'}
        paddingY={2}
        paddingX={3}
        borderBottom
      >
        <Flex alignItems="center" justifyContent="center" gap={2} flexWrap="wrap">
          <Suspense fallback={<VariantsStudioNavbarFallback />}>
            <VariantsStudioNavbar variantSelections={variantSelections} />
          </Suspense>
        </Flex>
      </Card>
    </Flex>
  )
}
