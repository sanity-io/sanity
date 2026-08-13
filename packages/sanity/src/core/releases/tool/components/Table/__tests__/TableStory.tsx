import {Flex, Text, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {useState} from 'react'

import {Table} from '../Table'
import {Headers} from '../TableHeader'
import {type Column} from '../types'

interface Datum {
  id: string
  title: string
}

const data: Datum[] = Array.from({length: 4}, (_, index) => ({
  id: `doc-${index}`,
  title: `Document ${index}`,
}))

const columns: Column<Datum>[] = [
  {
    id: 'title',
    width: null,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} sizing="border">
        <Headers.BasicHeader text="Title" />
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex align="center" paddingX={2} {...cellProps}>
        <Text size={1}>{datum.title}</Text>
      </Flex>
    ),
  },
]

const theme = buildTheme()

export function TableStory() {
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)

  return (
    <ThemeProvider theme={theme}>
      <div ref={setScrollContainer} style={{height: '400px', overflow: 'auto'}}>
        <Table<Datum>
          data={data}
          emptyState="No documents"
          rowId="id"
          columnDefs={columns}
          scrollContainerRef={scrollContainer}
        />
      </div>
    </ThemeProvider>
  )
}
