import {Box} from '@sanity/ui'

import {type FieldPreviewComponent} from '../../../preview'
import {numberWrapper} from './NumberPreview.css'

export const NumberPreview: FieldPreviewComponent<string> = (props) => {
  const {value} = props

  return (
    <Box className={numberWrapper} paddingX={2} paddingY={1}>
      {value}
    </Box>
  )
}
