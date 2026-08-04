import {type SanityDocument} from '@sanity/types'
import {Button, Card, Flex} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'
import {DocumentPaneContext} from 'sanity/_singletons'

// Real component from its real path (org contract §8): the "Inspect document" JSON view
// reachable from a document pane's menu.
import {type DocumentPaneContextValue} from '../../../../packages/sanity/src/structure/panes/document/DocumentPaneContext'
import {InspectDialog} from '../../../../packages/sanity/src/structure/panes/document/inspectDialog/InspectDialog'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * A realistic document to inspect: system fields plus a reference and a Portable Text
 * body, so both the parsed tree and the raw JSON have depth.
 */
const inspectedDocument: Partial<SanityDocument> = {
  _id: 'drafts.article-content-model-guide',
  _type: 'article',
  _rev: 'rev-article-3',
  _createdAt: '2027-01-05T09:00:00.000Z',
  _updatedAt: '2027-01-20T09:00:00.000Z',
  title: 'A field guide to content modelling',
  author: {_type: 'reference', _ref: 'author-tolstoy'},
  tags: ['schema', 'references', 'portable-text'],
  body: [
    {
      _key: 'block-1',
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{_key: 'span-1', _type: 'span', text: 'Model content, not pages.', marks: []}],
    },
  ],
}

// InspectDialog reads only `paneKey` + `onInspectClose` from the document-pane context;
// a minimal stub keeps the story off the full structure/DocumentPane harness (owned by
// another crew) while running the real dialog.
function useInspectPaneValue(onClose: () => void): DocumentPaneContextValue {
  return {
    paneKey: 'storybook-inspect',
    onInspectClose: onClose,
  } as unknown as DocumentPaneContextValue
}

function InspectDialogDemo({value}: {value: Partial<SanityDocument> | null}) {
  const [open, setOpen] = useState(true)
  const paneValue = useInspectPaneValue(() => setOpen(false))
  return (
    <Flex align="center" justify="center" padding={4} style={{minHeight: 480}}>
      {open ? (
        <DocumentPaneContext.Provider value={paneValue}>
          <InspectDialog value={value} />
        </DocumentPaneContext.Provider>
      ) : (
        <Card padding={2}>
          <Button text="Open inspect dialog" onClick={() => setOpen(true)} />
        </Card>
      )}
    </Flex>
  )
}

const meta: Meta = {
  title: 'Lists & Data/InspectDialog',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'InspectDialog is the escape hatch for seeing the actual document: the system fields, ' +
            'the exact reference, the shape a GROQ query will return, not the friendly form on ' +
            'top of it. It is one menu click away and one click to close.',
          '',
          '|          |                                                                                                                                                                                                                                              |',
          '| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/structure/panes/document/inspectDialog/InspectDialog.tsx`, Studio-only (no DS equivalent)                                                                                                                               |',
          '| Tier     | SERVICE. The document JSON inspector: a DS `Dialog` hosting a parsed tree (`@rexxars/react-json-inspector`, searchable) and a raw JSON `Code` view, toggled by a two-tab bar whose selection persists per pane via `useStructureToolSetting` |',
          '| Audit    | 🟢 holds (`editor-api-seam`). Inspect is the positive example: it exposes a document’s developer-facing identity, its raw JSON, system fields, references, from inside the editing UI, on demand, without leaving the document               |',
          '| Patterns | `editor-api-seam`                                                                                                                                                                                                                            |',
          '',
          'It hosts two views of the same document: a parsed, searchable tree for hunting a ' +
            'field, and a raw JSON `Code` view for copying the real thing. The tab you last used ' +
            'is remembered per pane.',
          '',
          'The story mounts the **real** `InspectDialog` on the studio provider stack ' +
            '(`lib/testProvider.tsx`) over a fixture document, with a minimal document-pane ' +
            'context stub (the dialog only reads `paneKey` + `onInspectClose`). The API is ' +
            'mocked, not the document.',
          '',
          '> **Why it matters:** this is the seam done right: the raw document is reachable ' +
            'from _inside_ the form, on demand, and gone again just as fast. Developers get ' +
            'ground truth without leaving the editor, and editors never have to see it unless ' +
            'they go looking.',
          '',
          'The last story shows it in context: opened on the "Anna Karenina" draft, the raw ' +
            'JSON behind the book being edited, `_id`, author `_ref` and all.',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders()],
  tags: [
    'autodocs',
    'chapter:data',
    'chapter:cms',
    'pattern:editor-api-seam',
    'audit:holds',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * Inspecting a document. The dialog portals to the document root, so the story renders in
 * its own iframe (`inline: false`) where the portal is bounded to the frame. Opens on the
 * parsed tree; the "Raw JSON" tab shows the serialized document.
 */
export const Default: Story = {
  name: 'Inspect document',
  parameters: {docs: {story: {inline: false, height: '620px'}}},
  render: () => <InspectDialogDemo value={inspectedDocument} />,
}

/**
 * The no-value branch: the dialog header falls back to its "no document" title and the
 * body renders `null`.
 */
export const NoValue: Story = {
  name: 'No value',
  parameters: {docs: {story: {inline: false, height: '620px'}}},
  render: () => <InspectDialogDemo value={null} />,
}

/**
 * The "Anna Karenina" draft from the shared fixture universe, the book being edited
 * across these stories, with its author `_ref` (`author-tolstoy`) and a Portable Text
 * synopsis, so the raw view has real references and nesting to show.
 */
const annaKareninaDraft: Partial<SanityDocument> = {
  _id: 'drafts.book-anna-karenina',
  _type: 'book',
  _rev: 'rev-book-draft-1',
  _createdAt: '2026-03-01T09:00:00Z',
  _updatedAt: '2026-03-01T09:00:00Z',
  title: 'Anna Karenina',
  author: {_type: 'reference', _ref: 'author-tolstoy'},
  synopsis: [
    {
      _key: 'block-1',
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{_key: 'span-1', _type: 'span', text: 'All happy families are alike.', marks: []}],
    },
  ],
}

/**
 * **In context.** Inspect opened on the "Anna Karenina" draft: the moment a developer
 * stops trusting the form and goes to the source. The parsed tree and the "Raw JSON" tab
 * show the same document Studio is editing: the `drafts.` id, the `author` reference by
 * `_ref`, the Portable Text synopsis as blocks. This is the escape hatch doing its job,
 * ground truth one menu-click away, gone again the moment you close it.
 */
export const InContext: Story = {
  name: 'In context (inspect Anna Karenina)',
  parameters: {controls: {include: []}, docs: {story: {inline: false, height: '620px'}}},
  render: () => <InspectDialogDemo value={annaKareninaDraft} />,
}
