import React from 'react'
import {Box, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import styled from 'styled-components'

interface VersionsTableProps {
  headings: string[]
  rows: {
    name: string
    items: string[]
  }[]
}

const CodeWithTextOverflowEllipsis = styled(Code)`
  & > code {
    display: block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
`

export function VersionsTable(props: VersionsTableProps) {
  const {headings, rows} = props

  if (rows.length === 0) {
    return null
  }

  return (
    <Stack space={2} role="table">
      <Flex>
        <Box flex={1}>
          <Text size={1} weight="semibold" role="columnheader" textOverflow="ellipsis">
            {headings[0]}
          </Text>
        </Box>

        <Flex flex={1}>
          {headings.slice(1, headings.length).map((heading) => (
            <Box flex={1} key={heading}>
              <Text size={1} weight="semibold" role="columnheader" textOverflow="ellipsis">
                {heading}
              </Text>
            </Box>
          ))}
        </Flex>
      </Flex>

      <Box>
        {rows?.map((row) => (
          <Card key={row.name} display="flex" paddingY={2} role="row">
            <Flex flex={1}>
              <Box flex={1} role="rowheader">
                <CodeWithTextOverflowEllipsis>{row.name}</CodeWithTextOverflowEllipsis>
              </Box>
              <Flex flex={1}>
                {row?.items?.map((item) => (
                  <Box flex={1} role="gridcell" key={item}>
                    <CodeWithTextOverflowEllipsis>{item}</CodeWithTextOverflowEllipsis>
                  </Box>
                ))}
              </Flex>
            </Flex>
          </Card>
        ))}
      </Box>
    </Stack>
  )
}
