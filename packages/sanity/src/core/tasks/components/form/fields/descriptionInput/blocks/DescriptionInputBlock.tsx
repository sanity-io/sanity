import {Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Box} from 'ui5'

import {normalText} from './DescriptionInputBlock.css'

interface NormalBlockProps {
  children: ReactNode
}

export function DescriptionInputBlock(props: NormalBlockProps) {
  const {children} = props

  return (
    <Box paddingTop={2} paddingBottom={3}>
      <Text className={normalText} size={1}>
        {children}
      </Text>
    </Box>
  )
}
