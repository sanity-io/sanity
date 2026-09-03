import {Card, Stack, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type RefObject} from 'react'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {
  activeASAPRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {LATEST, PUBLISHED} from '../../../releases/util/const'
import {
  getRangePosition,
  GlobalPerspectiveMenuItem,
  type LayerRange,
} from '../GlobalPerspectiveMenuItem'
import {ReleaseTypeMenuSection} from '../ReleaseTypeMenuSection'
import {type ScrollElement} from '../useScrollIndicatorVisibility'

// Layer stack mirrors ReleasesList: published (0) → drafts (1) → asap (2) →
// undecided (3). No scheduled release, so no relative publish dates.
const OFFSETS: LayerRange['offsets'] = {asap: 2, scheduled: 3, undecided: 3}

/** Default drafts perspective: the range ends at drafts, release labels sit outside it. */
const RANGE_TO_DRAFTS: LayerRange = {lastIndex: 1, offsets: OFFSETS}

/** Range spanning down to the undecided release: drafts and asap sit within it. */
const RANGE_TO_UNDECIDED: LayerRange = {lastIndex: 3, offsets: OFFSETS}

const SCROLL_REF: RefObject<ScrollElement> = {current: null}

function ReleasesMenu({range}: {range: LayerRange}) {
  return (
    <Card radius={3} shadow={2}>
      <Menu>
        <Card borderBottom padding={1}>
          <Stack gap={1}>
            <GlobalPerspectiveMenuItem
              rangePosition={getRangePosition(range, 0)}
              release={PUBLISHED}
            />
            <GlobalPerspectiveMenuItem
              rangePosition={getRangePosition(range, 1)}
              release={LATEST}
            />
          </Stack>
        </Card>
        <ReleaseTypeMenuSection
          currentGlobalBundleMenuItemRef={SCROLL_REF}
          range={range}
          releases={[activeASAPRelease]}
          releaseType="asap"
        />
        <ReleaseTypeMenuSection
          currentGlobalBundleMenuItemRef={SCROLL_REF}
          range={range}
          releases={[activeUndecidedRelease]}
          releaseType="undecided"
        />
      </Menu>
    </Card>
  )
}

/**
 * Chromatic sentinel for the perspective-menu layer line, rendered through
 * the production GlobalPerspectiveMenuItem / ReleaseTypeMenuSection so the
 * calibrated indicator offsets line up with the real ui5 IconWrapperBox and
 * label paddings. Covers first / within / last items, the default (pressed)
 * drafts item, and release-type labels inside and outside the range. Menus
 * stay closed; no scheduled release, so no relative dates.
 */
export function PerspectiveLayerIndicatorStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 320}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              drafts perspective (labels outside range)
            </Text>
            <ReleasesMenu range={RANGE_TO_DRAFTS} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              range down to undecided (first / within / last)
            </Text>
            <ReleasesMenu range={RANGE_TO_UNDECIDED} />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
