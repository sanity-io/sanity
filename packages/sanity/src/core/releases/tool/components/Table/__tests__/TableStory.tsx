import {Text, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {useState} from 'react'
import {Flex} from 'ui5'

import {RELEASES_OVERVIEW_TITLE_COLUMN_MIN_WIDTH} from '../../../overview/ReleasesOverviewColumnDefs'
import {Table} from '../Table'
import {Headers} from '../TableHeader'
import {type Column} from '../types'

interface Datum {
  id: string
  title: string
}

interface TableStoryProps {
  containerWidth?: number
  showRowActions?: boolean
}

const data: Datum[] = Array.from({length: 4}, (_, index) => ({
  id: `doc-${index}`,
  title: `Document ${index}`,
}))

function createColumns(showRowActions: boolean): Column<Datum>[] {
  const titleColumn: Column<Datum> = {
    id: 'title',
    width: null,
    style: showRowActions ? {minWidth: RELEASES_OVERVIEW_TITLE_COLUMN_MIN_WIDTH} : undefined,
    header: (props) => (
      <Flex {...props.headerProps} flexBasis="0%" flexGrow={1} paddingY={3}>
        <Headers.BasicHeader text="Title" />
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex alignItems="center" flexBasis="0%" flexGrow={1} paddingX={2} {...cellProps}>
        <Text size={1}>{datum.title}</Text>
      </Flex>
    ),
  }

  if (!showRowActions) {
    return [titleColumn]
  }

  return [
    titleColumn,
    {
      id: 'when',
      width: 280,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3}>
          <Headers.BasicHeader text="When" />
        </Flex>
      ),
      cell: ({cellProps}) => (
        <Flex alignItems="center" paddingX={2} {...cellProps}>
          <Text size={1}>As soon as possible</Text>
        </Flex>
      ),
    },
    {
      id: 'edited',
      width: 150,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3}>
          <Headers.BasicHeader text="Edited" />
        </Flex>
      ),
      cell: ({cellProps}) => (
        <Flex alignItems="center" paddingX={2} {...cellProps}>
          <Text size={1}>5 days ago</Text>
        </Flex>
      ),
    },
    {
      id: 'error',
      width: 40,
      header: ({headerProps}) => <Flex {...headerProps} paddingY={3} />,
      cell: ({cellProps}) => <Flex {...cellProps} paddingX={2} paddingY={3} />,
    },
    {
      id: 'documents',
      width: 120,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3}>
          <Headers.BasicHeader text="Documents" />
        </Flex>
      ),
      cell: ({cellProps}) => (
        <Flex alignItems="center" paddingX={2} {...cellProps}>
          <Text size={1}>12</Text>
        </Flex>
      ),
    },
  ]
}

const theme = buildTheme()

export function TableStory({containerWidth, showRowActions = false}: TableStoryProps = {}) {
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)
  const columns = createColumns(showRowActions)

  return (
    <ThemeProvider theme={theme}>
      <div
        ref={setScrollContainer}
        data-testid="table-scroll-container"
        style={{height: '400px', width: containerWidth, overflow: 'auto'}}
      >
        <Table<Datum>
          data={data}
          emptyState="No documents"
          rowId="id"
          columnDefs={columns}
          scrollContainerRef={scrollContainer}
          hideTableInlinePadding={showRowActions}
          rowActions={
            showRowActions
              ? () => (
                  <button type="button" data-testid="release-menu-button">
                    ...
                  </button>
                )
              : undefined
          }
        />
      </div>
    </ThemeProvider>
  )
}
