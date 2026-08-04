import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {Box, Card, Flex, Skeleton, Stack, Text, TextSkeleton} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useState} from 'react'

import {Table} from '../../../../packages/sanity/src/core/releases/tool/components/Table/Table'
import {TableEmptyState} from '../../../../packages/sanity/src/core/releases/tool/components/Table/TableEmptyState'
import {Headers} from '../../../../packages/sanity/src/core/releases/tool/components/Table/TableHeader'
import {
  type Column,
  type VisibleColumn,
} from '../../../../packages/sanity/src/core/releases/tool/components/Table/types'
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'

interface Book {
  _id: string
  title: string
  author: string
  year: number
  status: 'published' | 'draft'
}

const BOOKS: Book[] = [
  {_id: 'b1', title: 'Anna Karenina', author: 'Leo Tolstoy', year: 1878, status: 'published'},
  {_id: 'b2', title: 'War and Peace', author: 'Leo Tolstoy', year: 1869, status: 'published'},
  {_id: 'b3', title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813, status: 'draft'},
  {_id: 'b4', title: 'Persuasion', author: 'Jane Austen', year: 1817, status: 'published'},
  {
    _id: 'b5',
    title: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    year: 1866,
    status: 'draft',
  },
  {_id: 'b6', title: 'The Idiot', author: 'Fyodor Dostoevsky', year: 1869, status: 'published'},
  {_id: 'b7', title: 'Dune', author: 'Frank Herbert', year: 1965, status: 'published'},
  {_id: 'b8', title: 'Dune Messiah', author: 'Frank Herbert', year: 1969, status: 'draft'},
  {
    _id: 'b9',
    title: 'The Dispossessed',
    author: 'Ursula K. Le Guin',
    year: 1974,
    status: 'published',
  },
  {
    _id: 'b10',
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    year: 1969,
    status: 'published',
  },
  {_id: 'b11', title: 'Solaris', author: 'Stanisław Lem', year: 1961, status: 'draft'},
  {_id: 'b12', title: 'The Cyberiad', author: 'Stanisław Lem', year: 1965, status: 'published'},
]

/**
 * The scroll container the virtualizer measures against.
 *
 * `Table` does not own its own scroll element: it takes one as a prop (`scrollContainerRef`) and
 * hands it to `useVirtualizer`. That is not an oversight - the releases tool puts the scroll
 * boundary on the tool pane, outside the table, so the sticky header stays put while the rows
 * move. It does mean a story has to supply one, and has to supply it as STATE rather than a
 * `useRef`: the virtualizer needs a re-render once the element exists, and a ref mutation does
 * not cause one. Pass a ref and you get a table with a header and no rows.
 */
function TableStage({
  height = 340,
  children,
}: {
  height?: number
  children: (scrollContainer: HTMLDivElement | null) => ReactNode
}) {
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)
  return (
    <Card border radius={2} overflow="hidden">
      <div ref={setScrollContainer} style={{height, overflowY: 'auto'}}>
        {children(scrollContainer)}
      </div>
    </Card>
  )
}

function TextCell({children, muted}: {children: ReactNode; muted?: boolean}) {
  return (
    <Text size={1} muted={muted} textOverflow="ellipsis">
      {children}
    </Text>
  )
}

const bookColumns: Column<Book>[] = [
  {
    id: 'title',
    sorting: true,
    width: null,
    style: {minWidth: '240px'},
    header: (props) => (
      <Flex {...props.headerProps} flex={1} paddingY={3} paddingLeft={2} sizing="border">
        <Headers.SortHeaderButton {...props} text="Title" />
      </Flex>
    ),
    cell: ({datum, cellProps}) => (
      <Flex {...cellProps} flex={1} align="center" paddingX={3} paddingY={3} sizing="border">
        {datum.isLoading ? (
          <TextSkeleton style={{width: 180}} radius={1} animated />
        ) : (
          <TextCell>{datum.title}</TextCell>
        )}
      </Flex>
    ),
  },
  {
    id: 'author',
    sorting: true,
    width: 220,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton {...props} text="Author" />
      </Flex>
    ),
    cell: ({datum, cellProps}) => (
      <Flex {...cellProps} align="center" paddingX={3} paddingY={3} sizing="border">
        {datum.isLoading ? (
          <TextSkeleton style={{width: 120}} radius={1} animated />
        ) : (
          <TextCell muted>{datum.author}</TextCell>
        )}
      </Flex>
    ),
  },
  {
    id: 'year',
    sorting: true,
    width: 120,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.SortHeaderButton {...props} text="Year" />
      </Flex>
    ),
    cell: ({datum, cellProps}) => (
      <Flex {...cellProps} align="center" paddingX={3} paddingY={3} sizing="border">
        {datum.isLoading ? (
          <TextSkeleton style={{width: 40}} radius={1} animated />
        ) : (
          <TextCell muted>{datum.year}</TextCell>
        )}
      </Flex>
    ),
  },
  {
    id: 'status',
    sorting: false,
    width: 140,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.BasicHeader text="Status" />
      </Flex>
    ),
    cell: ({datum, cellProps}) => (
      <Flex {...cellProps} align="center" paddingX={3} paddingY={3} sizing="border">
        {datum.isLoading ? (
          <Skeleton style={{width: 56, height: 17}} radius={2} animated />
        ) : (
          <Card padding={1} radius={2} tone={datum.status === 'published' ? 'positive' : 'caution'}>
            <Text size={0}>{datum.status}</Text>
          </Card>
        )}
      </Flex>
    ),
  },
]

/** A search column, used by the stories that demonstrate filtering. */
const searchableTitleColumn: Column<Book> = {
  ...(bookColumns[0] as VisibleColumn<Book>),
  header: (props) => <Headers.TableHeaderSearch {...props} placeholder="Search books" />,
}

const searchByTitleOrAuthor = (data: Book[], searchTerm: string) => {
  const term = searchTerm.trim().toLowerCase()
  if (!term) return data
  return data.filter(
    (book) => book.title.toLowerCase().includes(term) || book.author.toLowerCase().includes(term),
  )
}

const meta: Meta = {
  title: 'Lists & Data/Table',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Table is a fully general primitive with no release-specific code in it, despite ' +
            'living in the releases folder: self-contained for interaction, delegated for ' +
            'semantics.',
          '',
          '|        |                                                                                                                                                                                            |',
          '| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |',
          '| Source | `packages/sanity/src/core/releases/tool/components/Table/Table.tsx`                                                                                                                        |',
          '| Tier   | CORE. The virtualized, sortable, searchable table behind the Releases overview                                                                                                             |',
          '| Audit  | 🔴 needs-work (ledger #52). A column whose value is a number never sorts, and fails silently: the header responds, the arrow rotates, no row moves. See the Current/Recommended pair below |',
          '',
          'A caller supplies `data`, a `columnDefs` array, a `rowId` path, and a scroll ' +
            'container. It gives back a sticky header, client-side sorting and searching, ' +
            '`@tanstack/react-virtual` row windowing, a loading skeleton, and an empty state.',
          '',
          'A second decision worth noticing: the loading state renders three real rows with ' +
            '`isLoading: true` passed down to every cell, rather than a spinner over the table. ' +
            'Each column draws its own skeleton at its own width, so the placeholder has the ' +
            'shape of the thing that is coming.',
          '',
          '**Two traps, both silent.** `scrollContainerRef` must be a state value, not a ' +
            '`useRef`: the virtualizer needs a render after the element exists, and a ref ' +
            'mutation gives it none, so the result is a header with no rows underneath and no ' +
            'error to explain it. And a numeric column will not sort unless it is also given a ' +
            '`sortTransform`, which is the defect the Current/Recommended pair below documents.',
          '',
          '> **Why it matters:** sorting and searching are held inside the table, so a column ' +
            'header can flip the sort without the parent knowing, but the data is filtered by a ' +
            'function the parent supplies, so the parent decides what "matching" means. The ' +
            'releases overview searches on title and description; another caller could search on ' +
            'anything, and neither has to reimplement the header or the sort toggle. The one ' +
            'thing the table refuses to own is scrolling, since the scroll boundary belongs to ' +
            'the surrounding pane.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:data',
    'chapter:releases',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

export const Populated: Story = {
  name: 'Populated',
  parameters: {
    docs: {
      description: {
        story:
          'Twelve rows in a 340px window, so only a handful are in the DOM at any moment. Scroll it and inspect: the row count stays roughly constant while `data-index` climbs, which is the virtualizer swapping rows in and out. The header stays put because it is `position: sticky` inside the same scroll container.',
      },
    },
  },
  render: () => (
    <TableStage>
      {(scrollContainer) => (
        <Table<Book>
          data={BOOKS}
          columnDefs={bookColumns}
          rowId="_id"
          emptyState="No books"
          scrollContainerRef={scrollContainer}
          hideTableInlinePadding
        />
      )}
    </TableStage>
  ),
}

export const Sortable: Story = {
  name: 'Sorting',
  parameters: {
    docs: {
      description: {
        story:
          'Click **Title** or **Author**. The first click sorts descending, clicking the same header again flips direction, and the arrow rotates 180 degrees rather than swapping glyph - a small thing that reads as the same control changing state instead of a different control appearing. Note "Status" has `sorting: false` and so renders as a plain label with nothing to click.',
      },
    },
  },
  render: () => (
    <TableStage>
      {(scrollContainer) => (
        <Table<Book>
          data={BOOKS}
          columnDefs={bookColumns}
          rowId="_id"
          emptyState="No books"
          defaultSort={{column: 'title', direction: 'asc'}}
          scrollContainerRef={scrollContainer}
          hideTableInlinePadding
        />
      )}
    </TableStage>
  ),
}

/**
 * Audit: Current: the numeric-sort defect, reproduced. See the upstream findings ledger #52.
 */
export const Current: Story = {
  name: 'numeric sort · Current (a number column never sorts)',
  parameters: {
    docs: {
      description: {
        story:
          "Click **Year**, twice. The button responds, the arrow rotates, the sort state updates - and not one row moves. Then click **Author** in the same table and watch it sort correctly. The header gives no indication that one of these columns is inert.\n\nThe comparator (`Table.tsx:73-97`) resolves each cell to a value, then takes the `localeCompare` branch only when **both** values are strings. A number falls through to the date branch, whose `parseDate` returns the number only `if (sortColumn?.sortTransform && typeof datum === 'number')`. With no `sortTransform` on the column, every row maps to `0`, the comparator returns `0 - 0`, and the sort is a stable no-op.\n\nNothing in the releases tool hits this, because every sortable column there is either a string or carries a `sortTransform`. It is a trap laid specifically for the next caller, which is what makes it worth pinning in a story rather than a comment.",
      },
    },
  },
  render: () => (
    <TableStage>
      {(scrollContainer) => (
        <Table<Book>
          data={BOOKS}
          columnDefs={bookColumns}
          rowId="_id"
          emptyState="No books"
          scrollContainerRef={scrollContainer}
          hideTableInlinePadding
        />
      )}
    </TableStage>
  ),
}

/**
 * Audit: Recommended: the workaround available to a caller today, and the shape the
 * one-line upstream fix would make unnecessary.
 */
export const Recommended: Story = {
  name: 'numeric sort · Recommended (declare a sortTransform)',
  parameters: {
    docs: {
      description: {
        story:
          'The same table with one line added to the Year column: `sortTransform: (book) => book.year`. Click **Year** now and it sorts. The transform is an identity function - it changes no value, it only satisfies the `sortColumn?.sortTransform &&` condition that the comparator uses to decide whether a number is allowed to be a number.\n\nThat is the workaround, and it works. The actual fix is upstream and smaller: delete that condition, so `parseDate` returns any number it is handed. It cannot regress the transform path, which already returns numbers. Until then, every numeric column in every future caller needs this identity function, and will be silently broken without it.',
      },
    },
  },
  render: () => (
    <TableStage>
      {(scrollContainer) => (
        <Table<Book>
          data={BOOKS}
          columnDefs={bookColumns.map((column) =>
            column.id === 'year'
              ? {...column, sortTransform: (book: Book & {isLoading?: boolean}) => book.year}
              : column,
          )}
          rowId="_id"
          emptyState="No books"
          scrollContainerRef={scrollContainer}
          hideTableInlinePadding
        />
      )}
    </TableStage>
  ),
}

export const Searchable: Story = {
  name: 'Searching',
  parameters: {
    docs: {
      description: {
        story:
          'The title header is replaced by `Headers.TableHeaderSearch`, which writes into the ' +
          'same table context the sort reads from. Type "lem" or "dune": the filtering itself ' +
          'is done by the `searchFilter` prop this story supplies, matching on title _or_ ' +
          'author, so an author name finds rows whose titles do not contain it. Clear the field ' +
          'and everything returns - the source data is never mutated.',
      },
    },
  },
  render: () => (
    <TableStage>
      {(scrollContainer) => (
        <Table<Book>
          data={BOOKS}
          columnDefs={[searchableTitleColumn, ...bookColumns.slice(1)]}
          rowId="_id"
          emptyState="No books match that search"
          searchFilter={searchByTitleOrAuthor}
          scrollContainerRef={scrollContainer}
          hideTableInlinePadding
        />
      )}
    </TableStage>
  ),
}

export const Loading: Story = {
  name: 'Loading',
  parameters: {
    docs: {
      description: {
        story:
          'Three skeleton rows, each cell drawing its own placeholder at roughly the width of the content it is standing in for. The search input is disabled while loading, because there is nothing to search yet and an enabled field that returns nothing reads as a broken search rather than a pending one.',
      },
    },
  },
  render: () => (
    <TableStage>
      {(scrollContainer) => (
        <Table<Book>
          data={[]}
          columnDefs={[searchableTitleColumn, ...bookColumns.slice(1)]}
          rowId="_id"
          emptyState="No books"
          loading
          scrollContainerRef={scrollContainer}
          hideTableInlinePadding
        />
      )}
    </TableStage>
  ),
}

export const Empty: Story = {
  name: 'Empty',
  parameters: {
    docs: {
      description: {
        story:
          'No data and not loading. The layout switches to a grid so the empty message centres ' +
          'in the remaining height rather than sitting under the header. An empty table looks ' +
          'composed instead of truncated.',
      },
    },
  },
  render: () => (
    <TableStage>
      {(scrollContainer) => (
        <Table<Book>
          data={[]}
          columnDefs={bookColumns}
          rowId="_id"
          emptyState="No books yet"
          scrollContainerRef={scrollContainer}
          hideTableInlinePadding
        />
      )}
    </TableStage>
  ),
}

export const EmptyStateComponent: Story = {
  name: 'Empty - a custom component',
  parameters: {
    docs: {
      description: {
        story:
          '`emptyState` takes a string or a component. The string form is for "nothing matched"; the component form is for "nothing exists yet", where an empty screen is the right moment to explain what the feature is and offer the action that ends the emptiness. Both are the same slot, and choosing between them is a content decision rather than a technical one.',
      },
    },
  },
  render: () => (
    <TableStage height={300}>
      {(scrollContainer) => (
        <Table<Book>
          data={[]}
          columnDefs={bookColumns}
          rowId="_id"
          emptyState={() => (
            <Stack gap={4} paddingY={4}>
              <Text size={1} weight="medium" align="center">
                No books yet
              </Text>
              <Text size={1} muted align="center">
                Books you create will be listed here.
              </Text>
              <Flex justify="center">
                <Button text="Create a book" mode="ghost" />
              </Flex>
            </Stack>
          )}
          scrollContainerRef={scrollContainer}
          hideTableInlinePadding
        />
      )}
    </TableStage>
  ),
}

export const WithRowActions: Story = {
  name: 'Row actions',
  parameters: {
    docs: {
      description: {
        story:
          'Passing `rowActions` appends a fixed 50px column that the caller never has to declare. It is skipped for skeleton rows (`datum.isLoading`), and when the callback returns nothing an empty box of the same width holds the space - so a row without an action does not pull the other columns sideways.',
      },
    },
  },
  render: () => (
    <TableStage>
      {(scrollContainer) => (
        <Table<Book>
          data={BOOKS}
          columnDefs={bookColumns}
          rowId="_id"
          emptyState="No books"
          rowActions={() => (
            <Button
              mode="bleed"
              icon={EllipsisHorizontalIcon}
              tooltipProps={{content: 'Actions'}}
            />
          )}
          scrollContainerRef={scrollContainer}
          hideTableInlinePadding
        />
      )}
    </TableStage>
  ),
}

export const RowTones: Story = {
  name: 'Per-row props',
  parameters: {
    docs: {
      description: {
        story:
          '`rowProps` returns partial Card props per row, which is how the releases overview tints a row that is currently selected, one whose scheduled date has slipped into the past, and one that has been deleted underneath you. Tone on the row rather than in a cell means the whole row reads as being in that state, which is the honest rendering when the state belongs to the record and not to one of its fields.',
      },
    },
  },
  render: () => (
    <TableStage>
      {(scrollContainer) => (
        <Table<Book>
          data={BOOKS}
          columnDefs={bookColumns}
          rowId="_id"
          emptyState="No books"
          rowProps={(book) =>
            book.status === 'draft' ? {tone: 'caution'} : book._id === 'b1' ? {tone: 'primary'} : {}
          }
          scrollContainerRef={scrollContainer}
          hideTableInlinePadding
        />
      )}
    </TableStage>
  ),
}

/**
 * TableEmptyState is exported separately and worth seeing on its own: it is the piece that
 * decides between the string and the component form, and it is what makes an empty table
 * centre rather than stack.
 */
export const EmptyStatePrimitive: Story = {
  name: 'TableEmptyState on its own',
  parameters: {
    docs: {
      description: {
        story:
          'The empty row rendered outside a table, both forms side by side. It renders a `<tr>` with a `<td colSpan>` - so it is only valid inside a table, and the frames below are supplying one.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      {[
        {label: 'string form', node: <TableEmptyState emptyState="No books match" colSpan={4} />},
        {
          label: 'component form',
          node: (
            <TableEmptyState
              colSpan={4}
              emptyState={() => (
                <Stack gap={3}>
                  <Text size={1} weight="medium">
                    No books yet
                  </Text>
                  <Text size={1} muted>
                    Books you create will be listed here.
                  </Text>
                </Stack>
              )}
            />
          ),
        },
      ].map(({label, node}) => (
        <Stack key={label} gap={3}>
          <Text size={0} muted>
            {label}
          </Text>
          <Card border radius={2}>
            <table style={{width: '100%'}}>
              <tbody style={{display: 'block'}}>{node}</tbody>
            </table>
          </Card>
        </Stack>
      ))}
    </Stack>
  ),
}

export const InContext: Story = {
  name: 'In context - a releases overview',
  parameters: {
    docs: {
      description: {
        story:
          'The shape the primitive was extracted from: a tool pane with a title, a tab row, and the table filling what is left. Everything the table needs from its surroundings is visible here - the pane owns the height and the scrolling, the table owns the rows.',
      },
    },
  },
  render: () => (
    <Card border radius={2} overflow="hidden" style={{maxWidth: 860}}>
      <Stack gap={0}>
        <Box padding={4}>
          <Stack gap={4}>
            <Text size={3} weight="semibold">
              Library
            </Text>
            <Flex gap={2}>
              <Button text="Published" mode="bleed" selected />
              <Button text="Drafts" mode="bleed" />
            </Flex>
          </Stack>
        </Box>
        <TableStage height={300}>
          {(scrollContainer) => (
            <Table<Book>
              data={BOOKS}
              columnDefs={[searchableTitleColumn, ...bookColumns.slice(1)]}
              rowId="_id"
              emptyState="No books match that search"
              searchFilter={searchByTitleOrAuthor}
              defaultSort={{column: 'title', direction: 'asc'}}
              scrollContainerRef={scrollContainer}
              hideTableInlinePadding
            />
          )}
        </TableStage>
      </Stack>
    </Card>
  ),
}
