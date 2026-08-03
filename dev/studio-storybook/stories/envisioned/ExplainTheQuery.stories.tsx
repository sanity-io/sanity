import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {DocumentIcon} from '@sanity/icons/Document'
import {SearchIcon} from '@sanity/icons/Search'
import {Badge, Box, Card, Flex, Stack, Switch, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useCallback, useMemo, useState} from 'react'

// Real component from its real path (org contract §8): the same listbox engine the
// global search overlay mounts — the explanation layer is pure row template.
import {CommandList} from '../../../../packages/sanity/src/core/components/commandList/CommandList'
import {type CommandListItemContext} from '../../../../packages/sanity/src/core/components/commandList/types'

interface Author {
  id: string
  name: string
}

interface Book {
  id: string
  title: string
  body: string
  authorId: string
}

const AUTHORS: Author[] = [
  {id: 'author-herbert', name: 'Frank Herbert'},
  {id: 'author-tolstoy', name: 'Leo Tolstoy'},
  {id: 'author-austen', name: 'Jane Austen'},
  {id: 'author-leguin', name: 'Ursula K. Le Guin'},
]

const BOOKS: Book[] = [
  {
    id: 'book-dune',
    title: 'Dune',
    body: 'Arrakis, the desert planet, and the spice that binds the Imperium together.',
    authorId: 'author-herbert',
  },
  {
    id: 'book-messiah',
    title: 'Dune Messiah',
    body: 'Twelve years after the desert war, the prophet contends with his own myth.',
    authorId: 'author-herbert',
  },
  {
    id: 'book-war',
    title: 'War and Peace',
    body: 'Five aristocratic families against the sweep of the Napoleonic wars.',
    authorId: 'author-tolstoy',
  },
  {
    id: 'book-anna',
    title: 'Anna Karenina',
    body: 'A married aristocrat and the affair that unravels her place in society.',
    authorId: 'author-tolstoy',
  },
  {
    id: 'book-pride',
    title: 'Pride and Prejudice',
    body: 'Elizabeth Bennet navigates manners, marriage and first impressions.',
    authorId: 'author-austen',
  },
  {
    id: 'book-dispossessed',
    title: 'The Dispossessed',
    body: 'A physicist travels between an anarchist moon and its capitalist planet.',
    authorId: 'author-leguin',
  },
]

/** Where a hit came from — the provenance the field's search results all discard. */
interface MatchExplanation {
  field: 'title' | 'body' | 'author'
  /** The matched text with the query span located, for highlighting. */
  snippet: string
  matchStart: number
  matchLength: number
  /** Set when the match travelled through a reference. */
  viaReference?: string
}

interface Hit {
  book: Book
  explanations: MatchExplanation[]
}

function findIn(text: string, query: string): {start: number} | null {
  const at = text.toLowerCase().indexOf(query)
  return at === -1 ? null : {start: at}
}

/** Search titles, bodies, and referenced author names — explaining every hit. */
function search(query: string): Hit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: Hit[] = []
  for (const book of BOOKS) {
    const explanations: MatchExplanation[] = []
    const inTitle = findIn(book.title, q)
    if (inTitle) {
      explanations.push({
        field: 'title',
        snippet: book.title,
        matchStart: inTitle.start,
        matchLength: q.length,
      })
    }
    const inBody = findIn(book.body, q)
    if (inBody) {
      explanations.push({
        field: 'body',
        snippet: book.body,
        matchStart: inBody.start,
        matchLength: q.length,
      })
    }
    const author = AUTHORS.find((candidate) => candidate.id === book.authorId)!
    const inAuthor = findIn(author.name, q)
    if (inAuthor) {
      explanations.push({
        field: 'author',
        snippet: author.name,
        matchStart: inAuthor.start,
        matchLength: q.length,
        viaReference: `Author → ${author.name}`,
      })
    }
    if (explanations.length > 0) hits.push({book, explanations})
  }
  return hits
}

/** The matched span, made visible: the term the engine actually matched, in situ. */
function Highlighted({explanation}: {explanation: MatchExplanation}) {
  const {snippet, matchStart, matchLength} = explanation
  return (
    <>
      {snippet.slice(0, matchStart)}
      <span
        style={{
          background: 'var(--card-badge-caution-bg-color)',
          color: 'var(--card-badge-caution-fg-color)',
          borderRadius: 2,
          padding: '0 1px',
        }}
      >
        {snippet.slice(matchStart, matchStart + matchLength)}
      </span>
      {snippet.slice(matchStart + matchLength)}
    </>
  )
}

const FIELD_LABEL: Record<MatchExplanation['field'], string> = {
  title: 'matched title',
  body: 'matched body',
  author: 'matched via reference',
}

function renderHit(
  hit: Hit,
  _context: CommandListItemContext,
  options: {explain: boolean},
): ReactNode {
  const primary = hit.explanations[0]
  return (
    <Card as="button" radius={2} padding={3}>
      <Flex align="flex-start" gap={3}>
        <Text size={2} muted>
          <DocumentIcon />
        </Text>
        <Stack gap={2} flex={1}>
          <Text size={1} textOverflow="ellipsis">
            {primary.field === 'title' ? <Highlighted explanation={primary} /> : hit.book.title}
          </Text>
          {options.explain &&
            hit.explanations.map((explanation) => (
              <Flex key={explanation.field} align="center" gap={2}>
                <Badge
                  fontSize={0}

                  tone={explanation.viaReference ? 'primary' : 'default'}
                >
                  {FIELD_LABEL[explanation.field]}
                </Badge>
                <Text size={0} muted textOverflow="ellipsis">
                  {explanation.viaReference ? (
                    <>
                      <ArrowRightIcon /> {explanation.viaReference.split(' → ')[0]} →{' '}
                      <Highlighted explanation={explanation} />
                    </>
                  ) : explanation.field === 'title' ? (
                    'shown above'
                  ) : (
                    <Highlighted explanation={explanation} />
                  )}
                </Text>
              </Flex>
            ))}
        </Stack>
        <Badge fontSize={0}>book</Badge>
      </Flex>
    </Card>
  )
}

const meta: Meta = {
  title: 'Envisioned/Explain the Query',
  parameters: {
    docs: {
      description: {
        component: [
          'A search result is an answer to a question the editor did not quite ask, and a bare ' +
            'list makes them guess the question back.',
          '',
          '| | |',
          '|---|---|',
          '| Anchor | `Actions & Commands/CommandList`, the Keyboard navigation (combobox) story: the exact input-plus-listbox composition the global search overlay mounts. This story keeps that harness and changes only what a result row is allowed to say |',
          '| Evidence | researcher’s brief Claim 3, explainable retrieval (all seven observed products return search results as bare lists; not one says why a result matched); audit `explain-the-query` and `sampling-disclosure`. The brief names Studio’s unfair advantage: GROQ is inspectable and Vision already exposes query mechanics beautifully, to developers |',
          '| Patterns | `explain-the-query` · `sampling-disclosure` |',
          '',
          'Every row here carries its match provenance: which field matched, the matched term ' +
            'highlighted in its own context, and, the case no product handles, matches that ' +
            'travelled through a reference, labelled as the path they took. Try `dune` (title ' +
            'matches), `desert` (body matches, highlighted mid-sentence), and `herbert` (neither ' +
            'title nor body contains it, the rows explain they matched through the referenced ' +
            'author, which in a bare list reads as a search bug and here reads as the content ' +
            'model working).',
          '',
          '> **Why it matters:** flip the explain switch off mid-query and the same result set ' +
            'becomes unaccountable. Editors mistrusting search, duplicates created because the ' +
            "original couldn't be found, is what this row template is priced against.",
        ].join('\n'),
      },
    },
  },
  tags: [
    'variant:envisioned',
    'chapter:data',
    'pattern:explain-the-query',
    'pattern:sampling-disclosure',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * The explained result list. Try `dune`, then `desert`, then `herbert`, three
 * queries, three different provenances, each one visible on the row. Flip the
 * explain switch off to see today's bare list render the identical hits.
 */
export const ExplainedResults: Story = {
  name: 'Explained results (why did this match?)',
  render: () => {
    function Demo() {
      const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
      const [query, setQuery] = useState('herbert')
      const [explain, setExplain] = useState(true)

      const hits = useMemo(() => search(query), [query])
      const render = useCallback(
        (hit: Hit, context: CommandListItemContext) => renderHit(hit, context, {explain}),
        [explain],
      )

      return (
        <Stack gap={3} style={{maxWidth: 560}}>
          <Flex gap={3} align="center" wrap="wrap">
            <Box flex={1} style={{minWidth: 200}}>
              <TextInput
                aria-label="Search content"
                icon={SearchIcon}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Search books…  (try “herbert”, “desert”, “dune”)"
                ref={setInputElement}
                value={query}
              />
            </Box>
            <Flex align="center" gap={2} style={{flexShrink: 0}}>
              <Switch
                checked={explain}
                onChange={(event) => setExplain(event.currentTarget.checked)}
                aria-label="Explain results"
              />
              <Text size={1} muted style={{whiteSpace: 'nowrap'}}>
                explain
              </Text>
            </Flex>
          </Flex>
          {query.trim() && (
            <Text size={0} muted>
              {hits.length === 0
                ? `0 matches for “${query.trim()}”`
                : `${hits.length} ${hits.length === 1 ? 'match' : 'matches'} · showing all ${hits.length}, no truncation`}
            </Text>
          )}
          <Card border radius={2} overflow="hidden" style={{height: 360}}>
            {hits.length > 0 ? (
              <CommandList
                activeItemDataAttr="data-hovered"
                ariaLabel="Search results"
                autoFocus="input"
                inputElement={inputElement}
                itemHeight={explain ? 92 : 45}
                items={hits}
                padding={1}
                renderItem={render}
              />
            ) : (
              <Flex align="center" height="fill" justify="center" padding={4}>
                <Text muted size={1}>
                  {query.trim()
                    ? `No title, body or referenced author contains “${query.trim()}”`
                    : 'Type to search'}
                </Text>
              </Flex>
            )}
          </Card>
          <Text size={0} muted>
            The reference-path rows are the ones bare lists turn into mysteries: “herbert” appears
            in no book title or body, yet two books match, and say why.
          </Text>
        </Stack>
      )
    }
    return <Demo />
  },
}
