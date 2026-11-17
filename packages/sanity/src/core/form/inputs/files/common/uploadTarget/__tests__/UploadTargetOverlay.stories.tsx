import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {Overlay} from '../styles'

/**
 * Chromatic sentinel for the file drop overlay the upload target shows while
 * files hover over it: an absolutely positioned `Layer` that covers the
 * target card (including its 2px border) with a translucent card-colored
 * backdrop and centers the drop message.
 */
function UploadTargetOverlayStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            upload target with files hovering
          </Text>
          <Card
            border
            data-testid="upload-target"
            padding={4}
            radius={2}
            style={{position: 'relative', minHeight: 160}}
            tone="primary"
          >
            <Text size={1}>Upload target content</Text>
            <Overlay data-testid="upload-target-overlay" zOffset={10}>
              <Text size={1} weight="medium">
                Drop to upload 2 files
              </Text>
            </Overlay>
          </Card>
        </VStack>
      </Card>
    </TestWrapper>
  )
}

const meta = {
  title: 'Form/Upload Target Overlay',
  component: UploadTargetOverlayStory,
} satisfies Meta<typeof UploadTargetOverlayStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Drop to upload 2 files')).toBeVisible(), {
      timeout: 5000,
    })
    const overlay = body.getByTestId('upload-target-overlay')
    await expect(body.getByTestId('upload-target')).toContainElement(overlay)
    await expect(body.getByText('Upload target content')).toBeInTheDocument()
  },
}
