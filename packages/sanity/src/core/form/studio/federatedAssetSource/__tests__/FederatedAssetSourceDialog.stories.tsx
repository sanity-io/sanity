import {Card, Text as UiText} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'
import {Box, Flex} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {FullSurfaceAppDialog} from '../Dialog'

const noop = () => undefined

/**
 * Styled-components sentinel for the federated asset source dialog shell:
 * `FullSurfaceAppDialog` (and the `AppDialog` it extends) fills the studio
 * surface with the 1.5rem padding as its only margin. The body is a static
 * stand-in for the federated view mount, so nothing is loaded over the
 * network.
 */
function FederatedAssetSourceDialogStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <FullSurfaceAppDialog
        header="Media Library"
        id="federated-asset-source-dialog"
        onClose={noop}
        open
        data-testid="federated-asset-source-dialog"
        width={5}
      >
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            borderTop: '1px solid',
            borderColor: 'var(--card-border-color)',
          }}
        >
          <Flex height="fill" alignItems="center" justifyContent="center">
            <Card padding={4} border radius={2} tone="transparent">
              <UiText muted>Federated view mounts here</UiText>
            </Card>
          </Flex>
        </Box>
      </FullSurfaceAppDialog>
    </TestWrapper>
  )
}

const meta = {
  title: 'Form/Federated Asset Source Dialog',
  component: FederatedAssetSourceDialogStory,
} satisfies Meta<typeof FederatedAssetSourceDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  // TestWrapper suspends on the mock workspace; wait for the dialog to paint.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Media Library')).toBeVisible(), {timeout: 5000})
    await expect(body.getByTestId('federated-asset-source-dialog')).toBeVisible()
    await expect(body.getByText('Federated view mounts here')).toBeVisible()
    await expect(body.getByRole('button', {name: 'Close dialog'})).toBeVisible()
  },
}
