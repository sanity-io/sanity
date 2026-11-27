import {Card, Text as UiText} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'
import {Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {createDefaultIcon} from '../createDefaultIcon'

const WORKSPACES = [
  {title: 'Studio', subtitle: 'production'},
  {title: 'My Studio', subtitle: 'staging'},
  {title: 'Staging 🟠', subtitle: 'staging'},
  {title: 'Ålesund Nyheter', subtitle: 'nb'},
  {title: 'Marketing Website Content', subtitle: 'production'},
] as const

/**
 * Styled-components sentinel for the generated workspace icon: the hue and
 * tint are hashed from the title and subtitle, so each fixture renders the
 * same colors on every run. Covers single-word, multi-word, emoji and
 * non-ASCII titles.
 */
function DefaultIconStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={3}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            generated workspace icons
          </Text>
          <Flex gap={3} flexWrap="wrap">
            {WORKSPACES.map((workspace) => (
              <Card key={workspace.title} padding={3} border radius={2}>
                <Flex alignItems="center" gap={3}>
                  <div style={{width: 33, height: 33}} data-testid="default-icon">
                    {createDefaultIcon(workspace.title, workspace.subtitle)}
                  </div>
                  <VStack gap={2}>
                    <UiText weight="medium">{workspace.title}</UiText>
                    <UiText size={1} muted>
                      {workspace.subtitle}
                    </UiText>
                  </VStack>
                </Flex>
              </Card>
            ))}
          </Flex>
        </VStack>
      </Card>
    </TestWrapper>
  )
}

const meta = {
  title: 'Config/Default Workspace Icon',
  component: DefaultIconStory,
} satisfies Meta<typeof DefaultIconStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    // The pane fades in after it has measured itself, so wait for visibility, not presence.
    await waitFor(() => expect(body.getByText('My Studio')).toBeVisible(), {timeout: 5000})
    await expect(body.getAllByTestId('default-icon')).toHaveLength(WORKSPACES.length)
    await expect(body.getByText('MS')).toBeVisible()
    await expect(body.getByText('ÅN')).toBeVisible()
    await expect(body.getByText('MW')).toBeVisible()
  },
}
