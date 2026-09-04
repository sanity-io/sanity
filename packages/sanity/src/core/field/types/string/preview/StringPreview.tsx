import {Box} from 'ui5'

import {type FieldPreviewComponent} from '../../../preview/types'
import {stringWrapper} from './StringPreview.css'

export const StringPreview: FieldPreviewComponent<string> = (props) => {
  const {value} = props

  return (
    <Box className={stringWrapper} paddingX={2} paddingY={1}>
      {value}
    </Box>
  )
}
