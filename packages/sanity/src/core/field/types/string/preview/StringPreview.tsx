import {styled} from 'styled-components'
import {Box} from 'ui5'

import {type FieldPreviewComponent} from '../../../preview/types'

const StringWrapper = styled.div`
  word-break: break-all;
  white-space: pre-wrap;
`

export const StringPreview: FieldPreviewComponent<string> = (props) => {
  const {value} = props

  return (
    <Box as={StringWrapper} paddingX={2} paddingY={1}>
      {value}
    </Box>
  )
}
