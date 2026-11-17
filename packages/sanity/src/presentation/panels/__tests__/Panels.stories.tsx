import {Card, Text as UiText} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'
import {Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {Panel} from '../Panel'
import {PanelResizer} from '../PanelResizer'
import {Panels} from '../Panels'

/**
 * Styled-components sentinel for the presentation tool's resizable panel
 * layout: two panels around an enabled resizer, plus a disabled resizer in
 * front of a third panel. Panel ids are explicit, so nothing random reaches
 * the layout.
 */
function PanelsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={3}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            presentation panels
          </Text>
          <Card border radius={2} style={{height: 240}} overflow="hidden">
            <Panels>
              <Panel id="preview" order={1} minWidth={200} defaultSize={50}>
                <Flex height="fill" alignItems="center" justifyContent="center">
                  <UiText>Preview panel</UiText>
                </Flex>
              </Panel>
              <PanelResizer id="preview-resizer" order={2} />
              <Panel id="document" order={3} minWidth={200} defaultSize={30}>
                <Flex height="fill" alignItems="center" justifyContent="center">
                  <UiText>Document panel</UiText>
                </Flex>
              </Panel>
              <PanelResizer id="inspector-resizer" order={4} disabled />
              <Panel id="inspector" order={5} minWidth={120} defaultSize={20}>
                <Flex height="fill" alignItems="center" justifyContent="center">
                  <UiText>Inspector panel</UiText>
                </Flex>
              </Panel>
            </Panels>
          </Card>
        </VStack>
      </Card>
    </TestWrapper>
  )
}

const meta = {
  title: 'Presentation/Panels',
  component: PanelsStory,
} satisfies Meta<typeof PanelsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    // The pane fades in after it has measured itself, so wait for visibility, not presence.
    await waitFor(() => expect(body.getByText('Preview panel')).toBeVisible(), {timeout: 5000})
    await expect(body.getByText('Document panel')).toBeVisible()
    await expect(body.getByText('Inspector panel')).toBeVisible()
  },
}
