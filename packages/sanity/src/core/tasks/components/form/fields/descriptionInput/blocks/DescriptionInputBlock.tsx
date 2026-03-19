import {Box, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

import * as classes from './DescriptionInputBlock.css'

interface NormalBlockProps {
  children: ReactNode
}

export function DescriptionInputBlock(props: NormalBlockProps) {
  const {children} = props

  return (
    <Box paddingTop={2} paddingBottom={3}>
      <Text className={classes.normalText} size={1}>{children}</Text>
    </Box>
  )
}
