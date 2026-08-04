import {Card, Stack} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useState} from 'react'

// Real component from real source (org contract §8): the Vision tool's saved-queries rail —
// the right-hand pane behind the collapse chevron. It is a real, shipped affordance backed by
// `useSavedQueries` (personal queries in the key-value store; shared queries as
// `vision.sharedQuery` documents). Mounted unmodified with harness-supplied callbacks.
import {QueryRecall} from '../../../../../packages/@sanity/vision/src/components/QueryRecall'
import {type ParsedUrlState} from '../../../../../packages/@sanity/vision/src/components/VisionGui'
import {createMockVisionClient} from '../../../lib/mockVisionClient'
import {WithStudioProviders} from '../../../lib/testProvider'
import {AuditNote, VISION_DATASET, visionSchemaTypes} from '../../../lib/visionStoryKit'

/**
 * A live host for the real `QueryRecall`. It supplies the URL encode / decode and the
 * current-query state that `VisionGui` normally provides, so Save (the +), inline rename,
 * click-to-load, and the actions menu all run against the harness key-value store. Personal
 * saves round-trip through `useSavedQueries` → the KV store; the list updates in place.
 */
function SavedQueriesHost(props: {compactMode?: boolean}) {
  const [currentQuery, setCurrentQuery] = useState('*[_type == "book"]{title, year}')
  const [currentParams] = useState<Record<string, unknown>>({minYear: 1850})

  const generateUrl = useCallback((query: string, params: Record<string, unknown>) => {
    const qs = new URLSearchParams({
      query,
      $params: JSON.stringify(params),
    })
    return `/${VISION_DATASET}/query?${qs.toString()}`
  }, [])

  const getStateFromUrl = useCallback((url: string): ParsedUrlState | null => {
    const qIndex = url.indexOf('?')
    if (qIndex === -1) return null
    const qs = new URLSearchParams(url.slice(qIndex + 1))
    const query = qs.get('query') ?? ''
    let params: Record<string, unknown> = {}
    try {
      params = JSON.parse(qs.get('$params') ?? '{}')
    } catch {
      params = {}
    }
    return {
      query,
      params,
      rawParams: JSON.stringify(params, null, 2),
      dataset: VISION_DATASET,
      apiVersion: 'v2025-02-19',
      customApiVersion: false,
      perspective: 'raw',
      url,
    }
  }, [])

  const setStateFromParsedUrl = useCallback((parsed: ParsedUrlState) => {
    setCurrentQuery(parsed.query)
  }, [])

  return (
    <Card border radius={2} overflow="hidden" style={{height: 560, width: 320, display: 'flex'}}>
      <QueryRecall
        url={generateUrl(currentQuery, currentParams)}
        getStateFromUrl={getStateFromUrl}
        setStateFromParsedUrl={setStateFromParsedUrl}
        currentQuery={currentQuery}
        currentParams={currentParams}
        generateUrl={generateUrl}
        compactMode={props.compactMode}
      />
    </Card>
  )
}

const meta: Meta = {
  title: 'Lists & Data/Vision/SavedQueries',
  parameters: {
    layout: 'fullscreen',
    controls: {include: []},
    docs: {
      description: {
        component: [
          'SavedQueries holds two kinds of saved query in one list: personal queries persist in ' +
            'a local key-value store, private and always available; shared queries are real ' +
            'documents in the workspace dataset that a teammate can see.',
          '',
          '|         |                                                                                                                                                                                               |',
          '| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source  | `packages/@sanity/vision/src/components/QueryRecall`, backed by the `useSavedQueries` hook; a real, shipped Vision feature behind the collapse chevron on the tool’s right edge               |',
          '| Tier    | SERVICE. Personal storage and shared storage, wired to one list                                                                                                                               |',
          '| Storage | personal: Studio key-value store (`studio.vision-tool.saved-queries`), private, no dataset writes · shared: `vision.sharedQuery` documents in the workspace dataset, author-only edit/unshare |',
          '',
          'The header carries a search box and an All / Personal / Shared tab filter; each row ' +
            'shows the query preview, a personal-lock or author avatar, and the saved date; the ' +
            'actions menu offers share, unshare, and delete; and a live query that has drifted ' +
            'from its saved form shows an "edited" dot and an Update button.',
          '',
          'Here it runs on the Storybook harness: the **+** saves the current query into the ' +
            'harness key-value store and the row appears; click a row to load it; rename inline. ' +
            'Shared queries need a real workspace dataset, so the Shared tab is empty in the ' +
            'harness, that half is dataset-backed, not local.',
          '',
          '> **Why it matters:** personal queries sit in the Studio key-value store, private, ' +
            'no dataset writes, while shared queries are real documents in the workspace dataset ' +
            'that teammates can see. Only the author can edit or unshare a shared one.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: visionSchemaTypes}},
      client: createMockVisionClient(),
    }),
  ],
  tags: ['autodocs', 'chapter:data', 'source:studio-only', 'tier:service'],
}

export default meta
type Story = StoryObj

/**
 * The real rail, live. Press **+** to save the current query into the harness key-value
 * store: the row appears immediately. Click a saved row to load it; click its title to
 * rename; use the ⋯ menu to delete. This is the shipped saved-queries affordance, mounted
 * whole.
 */
export const Rail: Story = {
  name: 'Saved-queries rail (live)',
  render: () => (
    <Card padding={4}>
      <Stack gap={3}>
        <SavedQueriesHost />
        <AuditNote tone="positive">
          Saved queries exist and work: this is the real component. Personal saves are local
          (key-value store); Shared saves are dataset documents, so the Shared tab needs a live
          workspace and stays empty here.
        </AuditNote>
      </Stack>
    </Card>
  ),
}

/** The same rail in `compactMode`: the narrow-breakpoint layout the tool uses when docked. */
export const Compact: Story = {
  name: 'Compact rail (narrow layout)',
  render: () => (
    <Card padding={4}>
      <SavedQueriesHost compactMode />
    </Card>
  ),
}
