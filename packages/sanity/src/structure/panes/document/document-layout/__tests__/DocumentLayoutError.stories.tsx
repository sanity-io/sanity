import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {DocumentLayoutError} from '../DocumentLayoutError'

/**
 * Chromatic sentinel for the caution `ErrorPane` a document pane renders when
 * its type is missing from the schema. `ErrorPane` wraps the body in a ui5 Box
 * with asymmetric padding, so this pins that spacing against the pane header.
 * The JSON representation card is dev-only (`isDev`): local Storybook and
 * addon-vitest render it, the production Chromatic build does not.
 *
 * The title and body currently render as raw `panes.document-pane.
 * document-unknown-type.*` keys: the component resolves them through the
 * studio namespace while the strings live in the structure bundle. That is
 * the paint the studio ships today, so it is what the baseline pins.
 */
const meta = {
  title: 'Structure/Document Layout Error',
  component: DocumentLayoutError,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <div style={{height: 420}}>
          <Story />
        </div>
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof DocumentLayoutError>

export default meta
type Story = StoryObj<typeof meta>

export const UnknownDocumentType: Story = {
  args: {
    paneKey: 'document-legacyArticle',
    documentType: 'legacyArticle',
    value: {
      _id: 'legacy-article-2019',
      _type: 'legacyArticle',
      title: 'Migrating off the legacy article type',
    },
  },
}

export const WithoutSchemaType: Story = {
  args: {
    paneKey: 'document-unknown',
  },
}
