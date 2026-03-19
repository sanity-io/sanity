import {Box} from '@sanity/ui'

import {type FieldPreviewComponent} from '../../../preview'
import {stringWrapper} from './StringPreview.css'

export const StringPreview: FieldPreviewComponent<string> = (props) => {
  const {value} = props

  return (
    <Box className={stringWrapper} paddingX={2} paddingY={1}>
      {value}
    </Box>
  )
}
