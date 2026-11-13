import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {PerspectiveContext} from 'sanity/_singletons'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type PerspectiveContextValue} from '../../types'
import {AgentBundleMenuItem} from '../releases/AgentBundleMenuItem'

const BUNDLE = {id: 'agent-story', applicationKey: 'story-app'}

const UNSELECTED: PerspectiveContextValue = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts',
  perspectiveStack: ['drafts'],
  excludedPerspectives: [],
  selectedVariantNames: [],
  selectedVariants: [],
  // oxlint-disable-next-line typescript/no-deprecated -- context still requires the single-variant field
  selectedVariantName: undefined,
  // oxlint-disable-next-line typescript/no-deprecated -- context still requires the single-variant field
  selectedVariant: undefined,
  bundle: 'drafts',
}

const SELECTED: PerspectiveContextValue = {
  ...UNSELECTED,
  selectedPerspectiveName: BUNDLE.id,
  selectedPerspective: BUNDLE.id,
  perspectiveStack: [BUNDLE.id, 'drafts'],
  bundle: BUNDLE.id,
}

function MenuCard({heading, perspective}: {heading: string; perspective: PerspectiveContextValue}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {heading}
      </Text>
      <PerspectiveContext.Provider value={perspective}>
        <Card padding={1} radius={2} shadow={2}>
          <Menu>
            <AgentBundleMenuItem bundle={BUNDLE} />
          </Menu>
        </Card>
      </PerspectiveContext.Provider>
    </VStack>
  )
}

/**
 * Chromatic sentinel for the agent-bundle perspective menu item: ui5 Box
 * padding around the sparkle icon (badge-suggest color), and the selected
 * MenuItem row whose title follows `--card-fg-color` so it stays readable on
 * the selected tone. Menus stay open as static lists. Shared with Storybook
 * via a thin CSF wrapper.
 */
export function AgentBundleMenuItemStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 320}}>
        <VStack gap={5}>
          <MenuCard heading="unselected" perspective={UNSELECTED} />
          <MenuCard heading="selected" perspective={SELECTED} />
        </VStack>
      </Card>
    </TestWrapper>
  )
}
