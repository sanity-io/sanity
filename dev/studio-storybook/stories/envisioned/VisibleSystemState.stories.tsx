import {CloseIcon} from '@sanity/icons/Close'
import {DocumentIcon} from '@sanity/icons/Document'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {FilterIcon} from '@sanity/icons/Filter'
import {SearchIcon} from '@sanity/icons/Search'
import {SortIcon} from '@sanity/icons/Sort'
import {Badge, Box, Button as UIButton, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useMemo, useState} from 'react'

interface Doc {
  id: string
  title: string
  type: 'book' | 'author'
  published: boolean
}

const DOCS: Doc[] = [
  {id: 'd1', title: 'War and Peace', type: 'book', published: true},
  {id: 'd2', title: 'Anna Karenina', type: 'book', published: true},
  {id: 'd3', title: 'The Kreutzer Sonata', type: 'book', published: false},
  {id: 'd4', title: 'Leo Tolstoy', type: 'author', published: true},
  {id: 'd5', title: 'Jane Austen', type: 'author', published: true},
  {id: 'd6', title: 'Emma', type: 'book', published: false},
  {id: 'd7', title: 'Frank Herbert', type: 'author', published: false},
  {id: 'd8', title: 'Dune', type: 'book', published: true},
]

type SortOrder = 'recent' | 'title'
type TypeFilter = 'all' | 'book' | 'author'
type Perspective = 'drafts' | 'published'

interface ViewState {
  sort: SortOrder
  filter: TypeFilter
  perspective: Perspective
  query: string
}

const DEFAULT_STATE: ViewState = {sort: 'recent', filter: 'all', perspective: 'drafts', query: ''}

/** One pipeline for both panels — the *only* difference between them is disclosure. */
function applyView(state: ViewState): {shown: Doc[]; hiddenMatches: Doc[]} {
  const q = state.query.trim().toLowerCase()
  const textMatch = (doc: Doc) => !q || doc.title.toLowerCase().includes(q)
  const scopeMatch = (doc: Doc) =>
    (state.filter === 'all' || doc.type === state.filter) &&
    (state.perspective === 'drafts' || doc.published)

  const shown = DOCS.filter((doc) => textMatch(doc) && scopeMatch(doc))
  if (state.sort === 'title') shown.sort((a, b) => a.title.localeCompare(b.title))
  // Matches the query but silently excluded by scope — the trap population.
  const hiddenMatches = DOCS.filter((doc) => textMatch(doc) && !scopeMatch(doc) && q.length > 0)
  return {shown, hiddenMatches}
}

function DocList({docs}: {docs: Doc[]}) {
  return (
    <Stack gap={1}>
      {docs.map((doc) => (
        <Card key={doc.id} radius={2} padding={3}>
          <Flex align="center" gap={3}>
            <Text size={1} muted>
              <DocumentIcon />
            </Text>
            <Box flex={1}>
              <Text size={1}>{doc.title}</Text>
            </Box>
            {!doc.published && (
              <Badge fontSize={0} tone="caution">
                draft
              </Badge>
            )}
            <Badge fontSize={0}>{doc.type}</Badge>
          </Flex>
        </Card>
      ))}
    </Stack>
  )
}

/** Shared control row — both panels expose identical controls. */
function Controls(props: {state: ViewState; onChange: (next: ViewState) => void}) {
  const {state, onChange} = props
  return (
    <Flex gap={2} wrap="wrap">
      <UIButton
        fontSize={1}
        icon={SortIcon}
        mode="ghost"
        text={state.sort === 'recent' ? 'Sort: recent' : 'Sort: title A–Z'}
        onClick={() => onChange({...state, sort: state.sort === 'recent' ? 'title' : 'recent'})}
      />
      <UIButton
        fontSize={1}
        icon={FilterIcon}
        mode="ghost"
        text={`Filter: ${state.filter}`}
        onClick={() =>
          onChange({
            ...state,
            filter: state.filter === 'all' ? 'book' : state.filter === 'book' ? 'author' : 'all',
          })
        }
      />
      <UIButton
        fontSize={1}
        icon={EyeOpenIcon}
        mode="ghost"
        text={`Perspective: ${state.perspective}`}
        onClick={() =>
          onChange({...state, perspective: state.perspective === 'drafts' ? 'published' : 'drafts'})
        }
      />
    </Flex>
  )
}

function isDefault(state: ViewState, key: 'sort' | 'filter' | 'perspective'): boolean {
  return state[key] === DEFAULT_STATE[key]
}

const meta: Meta = {
  title: 'Envisioned/Visible System State',
  parameters: {
    docs: {
      description: {
        component: [
          'A list is a claim: these are your documents. Every sort, filter and perspective ' +
            'quietly amends that claim, and today the amendments are stored in closed menus, the ' +
            'system knows the list is scoped and sorted, and the editor is left to remember.',
          '',
          '| | |',
          '|---|---|',
          '| Anchor | `Actions & Commands/CommandList` (Jump to item, the filter-as-navigation idiom) and `Overlays & Navigation/Tab`, the surfaces where applied view state currently vanishes into closed menus |',
          '| Evidence | audit `persistent-sort-filter`, `working-memory`, `selective-attention` (the perspective bar is easy to banner-blind); researcher’s brief §3, silent filters are one of the sixteen convergent failures |',
          '| Patterns | `persistent-sort-filter` · `working-memory` · `selective-attention` |',
          '',
          'The envisioned fix is a state strip: one persistent row above the list carrying a chip ' +
            'per active, non-default view state, each chip naming its effect and each dismissible ' +
            "in place. It's the list's fine print promoted to the surface, " +
            'so the reading of the list and the scope of the list are never separated.',
          '',
          '> **Why it matters:** both panels below share one data pipeline and identical controls; ' +
            'only disclosure differs. Set the filter to author, then search "dune." The silent ' +
            'panel answers "No results," flatly wrong in the way that creates duplicate content. ' +
            'The strip panel answers with the hidden-match count and a one-click widen. Same ' +
            'engine, same data, opposite conclusions.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'variant:envisioned',
    'chapter:lists',
    'chapter:lawsofux',
    'pattern:persistent-sort-filter',
    'pattern:working-memory',
    'pattern:selective-attention',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * Twin panels over one pipeline. Run the trap on both: Filter to author, then search
 * "dune". The left panel's answer is wrong in the costliest way a list can be wrong;
 * the right panel's strip keeps the scope attached to the claim. Then dismiss chips
 * one by one, each names exactly what it was doing to the list.
 */
export const TheStrip: Story = {
  name: 'The state strip (and the silent-filter trap)',
  render: () => {
    function Demo() {
      const [silent, setSilent] = useState<ViewState>(DEFAULT_STATE)
      const [strip, setStrip] = useState<ViewState>(DEFAULT_STATE)

      const silentView = useMemo(() => applyView(silent), [silent])
      const stripView = useMemo(() => applyView(strip), [strip])

      const chips: {key: 'sort' | 'filter' | 'perspective'; label: string}[] = [
        {key: 'sort', label: 'sorted: title A–Z'},
        {key: 'filter', label: `only ${strip.filter}s`},
        {key: 'perspective', label: 'published only'},
      ]
      const activeChips = chips.filter((chip) => !isDefault(strip, chip.key))

      return (
        <Flex gap={4} align="flex-start" wrap="wrap">
          {/* Panel 1 — today: state applies, then hides. */}
          <Stack gap={3} style={{width: 400}}>
            <Text size={1} weight="medium">
              Today, the state hides in closed menus
            </Text>
            <Controls state={silent} onChange={setSilent} />
            <TextInput
              aria-label="Search (silent panel)"
              icon={SearchIcon}
              placeholder="Search…  (try “dune” with filter: author)"
              value={silent.query}
              onChange={(event) => setSilent({...silent, query: event.currentTarget.value})}
            />
            <Card border radius={2} padding={2} style={{minHeight: 260}}>
              {silentView.shown.length > 0 ? (
                <DocList docs={silentView.shown} />
              ) : (
                <Flex align="center" justify="center" padding={4} style={{minHeight: 220}}>
                  <Text size={1} muted>
                    No results.
                  </Text>
                </Flex>
              )}
            </Card>
            <Text size={0} muted>
              Nothing on this panel says the list is scoped, the audit’s `persistent-sort-filter`
              finding, as shipped.
            </Text>
          </Stack>

          {/* Panel 2 — envisioned: the strip. */}
          <Stack gap={3} style={{width: 400}}>
            <Text size={1} weight="medium">
              Envisioned, the state strip
            </Text>
            <Controls state={strip} onChange={setStrip} />
            <TextInput
              aria-label="Search (strip panel)"
              icon={SearchIcon}
              placeholder="Search…  (same trap, same engine)"
              value={strip.query}
              onChange={(event) => setStrip({...strip, query: event.currentTarget.value})}
            />
            {activeChips.length > 0 && (
              <Card border radius={2} padding={2} tone="primary">
                <Flex align="center" gap={2} wrap="wrap">
                  <Text size={0} weight="medium">
                    Your view:
                  </Text>
                  {activeChips.map((chip) => (
                    <UIButton
                      key={chip.key}
                      fontSize={0}
                      padding={2}
                      mode="ghost"
                      iconRight={CloseIcon}
                      text={chip.label}
                      onClick={() => setStrip({...strip, [chip.key]: DEFAULT_STATE[chip.key]})}
                    />
                  ))}
                </Flex>
              </Card>
            )}
            <Card border radius={2} padding={2} style={{minHeight: 260}}>
              {stripView.shown.length > 0 ? (
                <DocList docs={stripView.shown} />
              ) : (
                <Flex align="center" justify="center" padding={4} style={{minHeight: 220}}>
                  <Stack gap={3} style={{textAlign: 'center'}}>
                    <Text size={1} muted>
                      {stripView.hiddenMatches.length > 0
                        ? `No results in this view, ${stripView.hiddenMatches.length} ${
                            stripView.hiddenMatches.length === 1 ? 'match is' : 'matches are'
                          } hidden by it`
                        : 'No results anywhere.'}
                    </Text>
                    {stripView.hiddenMatches.length > 0 && (
                      <Flex justify="center">
                        <UIButton
                          fontSize={1}
                          mode="ghost"
                          tone="primary"
                          text="Widen the view"
                          onClick={() => setStrip({...DEFAULT_STATE, query: strip.query})}
                        />
                      </Flex>
                    )}
                  </Stack>
                </Flex>
              )}
            </Card>
            <Text size={0} muted>
              The empty state names the scope that produced it, the honest answer the benchmark
              found in zero of eight products.
            </Text>
          </Stack>
        </Flex>
      )
    }
    return <Demo />
  },
}
