import {Box} from '@sanity/ui'
import {styled} from 'styled-components'

import {type FieldPreviewComponent} from '../../../preview'

const NumberWrapper = styled.div`
  display: inline-block;
  word-break: break-all;
`

export const NumberPreview: FieldPreviewComponent<string> = (props) => {
  const {value} = props

  return (
    <Box as={NumberWrapper} paddingX={2} paddingY={1}>
      {value}
    </Box>
  )
}
