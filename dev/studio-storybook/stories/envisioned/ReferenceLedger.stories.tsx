import {LinkIcon} from '@sanity/icons/Link'
import {LinkRemovedIcon} from '@sanity/icons/LinkRemoved'
import {TransferIcon} from '@sanity/icons/Transfer'
import {TrashIcon} from '@sanity/icons/Trash'
import {UserIcon} from '@sanity/icons/User'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Badge, Box, Button as UIButton, Card, Flex, Inline, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useMemo, useState} from 'react'

interface AuthorDoc {
  id: string
  name: string
}

interface BookDoc {
  id: string
  title: string
  /** The reference under protection; null after a destructive delete = dangling. */
  authorId: string | null
}

const INITIAL_AUTHORS: AuthorDoc[] = [
  {id: 'author-tolstoy', name: 'Leo Tolstoy'},
  {id: 'author-austen', name: 'Jane Austen'},
  {id: 'author-herbert', name: 'Frank Herbert'},
]

let logCounter = 0

const INITIAL_BOOKS: BookDoc[] = [
  {id: 'book-war', title: 'War and Peace', authorId: 'author-tolstoy'},
  {id: 'book-anna', title: 'Anna Karenina', authorId: 'author-tolstoy'},
  {id: 'book-kreutzer', title: 'The Kreutzer Sonata', authorId: 'author-tolstoy'},
  {id: 'book-pride', title: 'Pride and Prejudice', authorId: 'author-austen'},
  {id: 'book-emma', title: 'Emma', authorId: 'author-austen'},
  {id: 'book-dune', title: 'Dune', authorId: 'author-herbert'},
]

const meta: Meta = {
  title: 'Envisioned/Reference Ledger',
  parameters: {
    docs: {
      description: {
        component: [
          'Contentstack claimed the floor, warn-on-delete checkpoints, a Reference Map you ' +
            'visit, while the benchmark ran; reference-integrity is the single most-cited defect ' +
            'of the 8-product corpus, and Studio currently fails it outright.',
          '',
          '| | |',
          '|---|---|',
          '| Anchor | `Forms & Input/ReferenceInput` (the Current / Recommended create-flow pairs, the dangling-reference defect, live) and `Overlays & Navigation/Dialog` Current (stuck confirm), where the reference check that should protect a delete never resolves. Those stories protect single moments; this one protects the graph |',
          '| Evidence | researcher’s brief Claim 2, the graph is the safety: the ceiling above the floor is integrity as ambient state, reference counts always visible on the document, consequences shown before the click, resolution paths offered rather than warnings issued. Audit: `reference-integrity` is the single most-cited defect of the 8-product corpus |',
          '| Patterns | `reference-integrity` · `node-link-vs-matrix` |',
          '',
          'The design inverts the checkpoint model in three ways. Integrity is ambient: every ' +
            'author row wears its live incoming-reference count at rest, no dialog, no map to ' +
            "visit; the count is the delete affordance's context. Consequences precede the click: " +
            'arming Delete (one click) shows exactly which documents break, while the destructive ' +
            'commit stays a second, separate act, the danger is legible on approach, not ' +
            "announced after. Resolution beats warning: the armed state's primary action reassigns " +
            'references first; "delete anyway" stays available but secondary.',
          '',
          'Because the whole surface derives from one live graph state, every action updates ' +
            'every count everywhere at once, the property the brief says only a realtime ' +
            'substrate makes cheap.',
          '',
          '> **Why it matters:** delete Tolstoy without reassigning and watch the strip go ' +
            'critical and each broken book wear its own dangling badge with a per-row repair, the ' +
            'corpus failure state, rendered legible and recoverable instead of silent.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'variant:envisioned',
    'chapter:cms',
    'chapter:data',
    'pattern:reference-integrity',
    'pattern:node-link-vs-matrix',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/**
 * The ledger, live. Every count derives from the same graph state: pick an author,
 * arm Delete, and read the consequences before anything is committed. Reassign moves
 * all incoming references in one act; Delete anyway produces honest, badged damage
 * with per-row repair. There is no modal anywhere, integrity is a property of the
 * surface, not an interruption.
 */
export const Ledger: Story = {
  name: 'The ledger (ambient integrity)',
  render: () => {
    function Demo() {
      const [authors, setAuthors] = useState<AuthorDoc[]>(INITIAL_AUTHORS)
      const [books, setBooks] = useState<BookDoc[]>(INITIAL_BOOKS)
      const [selectedId, setSelectedId] = useState<string>('author-tolstoy')
      const [armed, setArmed] = useState(false)
      const [log, setLog] = useState<{id: number; text: string}[]>([])

      const incoming = useMemo(() => {
        const counts = new Map<string, BookDoc[]>()
        for (const author of authors) counts.set(author.id, [])
        for (const book of books) {
          if (book.authorId && counts.has(book.authorId)) counts.get(book.authorId)!.push(book)
        }
        return counts
      }, [authors, books])

      const dangling = useMemo(() => books.filter((book) => book.authorId === null), [books])
      const liveRefs = books.length - dangling.length
      const selected = authors.find((author) => author.id === selectedId)
      const selectedIncoming = selected ? (incoming.get(selected.id) ?? []) : []
      const reassignTargets = authors.filter((author) => author.id !== selectedId)

      const note = (message: string) =>
        setLog((prev) => [{id: ++logCounter, text: message}, ...prev].slice(0, 4))

      const handleReassign = (targetId: string) => {
        const target = authors.find((author) => author.id === targetId)!
        setBooks((prev) =>
          prev.map((book) => (book.authorId === selectedId ? {...book, authorId: targetId} : book)),
        )
        note(`Reassigned ${selectedIncoming.length} references to ${target.name}.`)
        setArmed(false)
      }

      const handleDelete = (mode: 'clean' | 'destructive') => {
        if (mode === 'destructive') {
          setBooks((prev) =>
            prev.map((book) => (book.authorId === selectedId ? {...book, authorId: null} : book)),
          )
          note(`Deleted ${selected?.name}, ${selectedIncoming.length} references now dangling.`)
        } else {
          note(`Deleted ${selected?.name}, no references were pointing at it.`)
        }
        setAuthors((prev) => prev.filter((author) => author.id !== selectedId))
        setSelectedId(authors.find((author) => author.id !== selectedId)?.id ?? '')
        setArmed(false)
      }

      const handleRepair = (bookId: string, targetId: string) => {
        setBooks((prev) =>
          prev.map((book) => (book.id === bookId ? {...book, authorId: targetId} : book)),
        )
        note('Repaired one dangling reference.')
      }

      return (
        <Stack gap={3} style={{maxWidth: 760}}>
          {/* The proof device: the always-on ledger strip. */}
          <Card
            border
            padding={3}
            radius={2}
            tone={dangling.length > 0 ? 'critical' : 'transparent'}
          >
            <Flex align="center" gap={4} wrap="wrap">
              <Text size={1} weight="medium">
                Ledger
              </Text>
              <Text size={1} muted>
                {authors.length + books.length} documents
              </Text>
              <Text size={1} muted>
                <LinkIcon /> {liveRefs} live references
              </Text>
              <Text size={1} weight={dangling.length > 0 ? 'semibold' : undefined}>
                <LinkRemovedIcon /> {dangling.length} dangling
              </Text>
            </Flex>
          </Card>

          <Flex gap={3} align="flex-start" wrap="wrap">
            {/* Authors: incoming counts worn at rest. */}
            <Card border radius={2} padding={2} style={{width: 280}}>
              <Stack gap={1}>
                <Box padding={2}>
                  <Text size={0} muted weight="medium">
                    Authors, counts always visible
                  </Text>
                </Box>
                {authors.map((author) => {
                  const count = incoming.get(author.id)?.length ?? 0
                  return (
                    <Card
                      key={author.id}
                      as="button"
                      radius={2}
                      padding={3}
                      tone={author.id === selectedId ? 'primary' : 'default'}
                      onClick={() => {
                        setSelectedId(author.id)
                        setArmed(false)
                      }}
                    >
                      <Flex align="center" gap={3}>
                        <Text size={1}>
                          <UserIcon />
                        </Text>
                        <Box flex={1}>
                          <Text size={1}>{author.name}</Text>
                        </Box>
                        <Badge fontSize={0} tone={count > 0 ? 'primary' : 'default'}>
                          {count} in
                        </Badge>
                      </Flex>
                    </Card>
                  )
                })}
                {authors.length === 0 && (
                  <Box padding={3}>
                    <Text size={1} muted>
                      No authors left.
                    </Text>
                  </Box>
                )}
              </Stack>
            </Card>

            {/* The selected document: where-used + the armed delete. */}
            <Stack gap={3} flex={1} style={{minWidth: 340}}>
              {selected ? (
                <Card border radius={2} padding={3}>
                  <Stack gap={3}>
                    <Flex align="center" gap={2}>
                      <Text size={1} weight="medium">
                        {selected.name}
                      </Text>
                      <Badge fontSize={0}>author</Badge>
                    </Flex>
                    <Stack gap={2}>
                      <Text size={0} muted weight="medium">
                        Used by {selectedIncoming.length}{' '}
                        {selectedIncoming.length === 1 ? 'document' : 'documents'}
                      </Text>
                      {selectedIncoming.map((book) => (
                        <Flex key={book.id} align="center" gap={2}>
                          <Text size={1} muted>
                            <LinkIcon />
                          </Text>
                          <Text size={1}>{book.title}</Text>
                        </Flex>
                      ))}
                      {selectedIncoming.length === 0 && (
                        <Text size={1} muted>
                          Nothing references this document, deleting is consequence-free.
                        </Text>
                      )}
                    </Stack>
                    {!armed ? (
                      <Flex>
                        <UIButton
                          icon={TrashIcon}
                          text="Delete…"
                          tone="critical"
                          mode="ghost"
                          onClick={() =>
                            selectedIncoming.length > 0 ? setArmed(true) : handleDelete('clean')
                          }
                        />
                      </Flex>
                    ) : (
                      <Card border radius={2} padding={3} tone="caution">
                        <Stack gap={3}>
                          <Flex gap={2}>
                            <Text size={1}>
                              <WarningOutlineIcon />
                            </Text>
                            <Text size={1}>
                              Deleting <strong>{selected.name}</strong> breaks{' '}
                              {selectedIncoming.length} references, shown above, before any commit.
                            </Text>
                          </Flex>
                          <Stack gap={2}>
                            <Text size={0} muted weight="medium">
                              Resolve first (the safe path is the short path)
                            </Text>
                            <Inline gap={2}>
                              {reassignTargets.map((target) => (
                                <UIButton
                                  key={target.id}
                                  icon={TransferIcon}
                                  text={`Reassign all to ${target.name}`}
                                  mode="ghost"
                                  tone="primary"
                                  onClick={() => handleReassign(target.id)}
                                />
                              ))}
                            </Inline>
                          </Stack>
                          <Flex gap={2}>
                            <UIButton text="Cancel" mode="bleed" onClick={() => setArmed(false)} />
                            <UIButton
                              text={`Delete anyway (leaves ${selectedIncoming.length} dangling)`}
                              tone="critical"
                              onClick={() => handleDelete('destructive')}
                            />
                          </Flex>
                        </Stack>
                      </Card>
                    )}
                  </Stack>
                </Card>
              ) : (
                <Card border radius={2} padding={4}>
                  <Text size={1} muted>
                    Every author is gone. The books below carry the damage, honestly.
                  </Text>
                </Card>
              )}

              {/* Books: dangling damage is visible and repairable in place. */}
              <Card border radius={2} padding={2}>
                <Stack gap={1}>
                  <Box padding={2}>
                    <Text size={0} muted weight="medium">
                      Books, each shows its reference state
                    </Text>
                  </Box>
                  {books.map((book) => {
                    const author = authors.find((candidate) => candidate.id === book.authorId)
                    const isDangling = book.authorId === null
                    return (
                      <Card
                        key={book.id}
                        radius={2}
                        padding={3}
                        tone={isDangling ? 'critical' : 'default'}
                      >
                        <Flex align="center" gap={3} wrap="wrap">
                          <Box flex={1}>
                            <Text size={1}>{book.title}</Text>
                          </Box>
                          {isDangling ? (
                            <>
                              <Badge fontSize={0} tone="critical">
                                <LinkRemovedIcon /> dangling reference
                              </Badge>
                              {authors.slice(0, 2).map((target) => (
                                <UIButton
                                  key={target.id}
                                  fontSize={0}
                                  padding={2}
                                  mode="ghost"
                                  text={`Repair → ${target.name.split(' ').pop()}`}
                                  onClick={() => handleRepair(book.id, target.id)}
                                />
                              ))}
                            </>
                          ) : (
                            <Badge fontSize={0}>→ {author?.name ?? '?'}</Badge>
                          )}
                        </Flex>
                      </Card>
                    )
                  })}
                </Stack>
              </Card>
            </Stack>
          </Flex>

          {log.length > 0 && (
            <Card border padding={3} radius={2} tone="transparent">
              <Stack gap={2}>
                <Text size={0} muted weight="medium">
                  What just happened
                </Text>
                {log.map((entry, index) => (
                  <Text key={entry.id} size={1} muted={index > 0}>
                    {entry.text}
                  </Text>
                ))}
              </Stack>
            </Card>
          )}
        </Stack>
      )
    }
    return <Demo />
  },
}
