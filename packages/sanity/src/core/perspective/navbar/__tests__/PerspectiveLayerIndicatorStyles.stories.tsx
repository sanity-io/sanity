import {Card, Text as UiText} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {
  GlobalPerspectiveMenuItemIndicator,
  GlobalPerspectiveMenuLabelIndicator,
} from '../PerspectiveLayerIndicator'

const RELEASES = [
  {title: 'Published', position: 'first', isDefault: true},
  {title: 'Drafts', position: 'middle', isDefault: false},
  {title: 'Spring campaign', position: 'last', isDefault: false},
] as const

/**
 * Styled-components sentinel for the perspective menu's layer indicator
 * rails: the item indicator in its first, middle and last range positions
 * (plus one item outside the range) and the section label indicator with and
 * without the connecting rail.
 */
function PerspectiveLayerIndicatorStylesStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={3}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            perspective layer indicators
          </Text>
          <Card border radius={2} style={{width: 280}}>
            <Menu padding={1}>
              <GlobalPerspectiveMenuLabelIndicator
                $withinRange={false}
                paddingLeft={2}
                paddingTop={3}
                paddingBottom={1}
              >
                <UiText muted size={1} weight="medium">
                  LAYERS
                </UiText>
              </GlobalPerspectiveMenuLabelIndicator>
              {RELEASES.map((release) => (
                <GlobalPerspectiveMenuItemIndicator
                  key={release.title}
                  $isDefaultPerspective={release.isDefault}
                  $first={release.position === 'first'}
                  $last={release.position === 'last'}
                  $inRange
                  data-testid={`layer-indicator-${release.position}`}
                >
                  <MenuItem text={release.title} pressed={release.isDefault} />
                </GlobalPerspectiveMenuItemIndicator>
              ))}
              <GlobalPerspectiveMenuLabelIndicator
                $withinRange
                paddingLeft={2}
                paddingTop={3}
                paddingBottom={1}
              >
                <UiText muted size={1} weight="medium">
                  UNDECIDED
                </UiText>
              </GlobalPerspectiveMenuLabelIndicator>
              <GlobalPerspectiveMenuItemIndicator
                $isDefaultPerspective={false}
                $first={false}
                $last={false}
                $inRange={false}
                data-testid="layer-indicator-outside"
              >
                <MenuItem text="Summer sale" />
              </GlobalPerspectiveMenuItemIndicator>
            </Menu>
          </Card>
        </VStack>
      </Card>
    </TestWrapper>
  )
}

const meta = {
  title: 'Perspective/Layer Indicator Styles',
  component: PerspectiveLayerIndicatorStylesStory,
} satisfies Meta<typeof PerspectiveLayerIndicatorStylesStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    // The pane fades in after it has measured itself, so wait for visibility, not presence.
    await waitFor(() => expect(body.getByText('Spring campaign')).toBeVisible(), {timeout: 5000})
    await expect(body.getByTestId('layer-indicator-first')).toBeVisible()
    await expect(body.getByTestId('layer-indicator-last')).toBeVisible()
    await expect(body.getByTestId('layer-indicator-outside')).toBeVisible()
    await expect(body.getByText('Summer sale')).toBeVisible()
  },
}
