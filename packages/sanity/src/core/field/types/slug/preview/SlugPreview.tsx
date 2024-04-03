import {type Slug} from '@sanity/types'
import {Box} from '@sanity/ui'
import {styled} from 'styled-components'

import {type FieldPreviewComponent} from '../../../preview'

const SlugWrapper = styled.div`
  display: inline-block;
  word-break: break-all;
  white-space: pre-wrap;
`

export const SlugPreview: FieldPreviewComponent<Slug> = (props) => {
  const {value} = props

  return (
    <Box as={SlugWrapper} paddingX={2} paddingY={1}>
      {value.current}
    </Box>
  )
}
