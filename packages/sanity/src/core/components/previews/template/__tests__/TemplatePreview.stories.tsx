import {DocumentIcon} from '@sanity/icons/Document'
import {Card, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {VStack} from 'ui5'

import {TemplatePreview} from '../TemplatePreview'

/**
 * Chromatic sentinel for the "new document" template preview: the title /
 * subtitle column next to the optional media, and the description below the
 * header row. Filled states only — the placeholder uses animated skeletons.
 *
 * `title` and `subtitle` accept a component or a node. Bare strings take the
 * component branch (`isValidElementType` accepts host tag names), so the
 * fixtures pass fragments and components rather than strings.
 */
const meta = {
  title: 'Studio/Template Preview',
  component: TemplatePreview,
} satisfies Meta<typeof TemplatePreview>

export default meta
type Story = StoryObj<typeof meta>

function Labelled({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium">
        {label}
      </Text>
      <Card border padding={2} radius={2} tone="inherit">
        {children}
      </Card>
    </VStack>
  )
}

function ComponentTitle() {
  return <>Article (component title)</>
}

function ComponentSubtitle() {
  return <>Editorial</>
}

export const States: Story = {
  render: () => (
    <Card padding={4} style={{maxWidth: 420}}>
      <VStack gap={5}>
        <Labelled label="title only">
          <TemplatePreview title={<>Article</>} />
        </Labelled>
        <Labelled label="title subtitle media">
          <TemplatePreview
            media={<DocumentIcon />}
            subtitle={<>Long-form article</>}
            title={<>Article</>}
          />
        </Labelled>
        <Labelled label="component title and subtitle, description">
          <TemplatePreview
            description={'Starts with a byline and a lead paragraph.\nUsed by the editorial team.'}
            media={<DocumentIcon />}
            subtitle={ComponentSubtitle}
            title={ComponentTitle}
          />
        </Labelled>
        <Labelled label="long title truncates">
          <TemplatePreview
            media={<DocumentIcon />}
            subtitle={<>Landing page</>}
            title={
              <>
                A very long template title that does not fit on one line and must be truncated with
                an ellipsis
              </>
            }
          />
        </Labelled>
      </VStack>
    </Card>
  ),
}
