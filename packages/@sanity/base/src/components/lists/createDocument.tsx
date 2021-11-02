import {Box, Grid} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {CreateDocumentPreview} from '../previews'

export interface CreateDocumentPreviewItem {
  key: string
  title?: string
  subtitle?: string
  icon?: React.ComponentType<unknown>
  onClick?: () => void
}

interface CreateDocumentListProps {
  items: CreateDocumentPreviewItem[]
}

const List = styled.ul`
  margin: 0;
  padding: 0;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
`

export function CreateDocumentList(props: CreateDocumentListProps) {
  const {items = []} = props

  return (
    <Grid gap={3} as={List}>
      {items.map((item) => (
        <Box as="li" key={item.key}>
          <CreateDocumentPreview {...item} />
        </Box>
      ))}
    </Grid>
  )
}
