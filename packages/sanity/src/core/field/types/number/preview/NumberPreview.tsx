import {styled} from 'styled-components'
import {Box} from 'ui5'

import {type FieldPreviewComponent} from '../../../preview/types'

const NumberWrapper = styled.div`
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
