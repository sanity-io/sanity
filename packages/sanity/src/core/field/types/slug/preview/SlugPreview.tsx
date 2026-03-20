import {type Slug} from '@sanity/types'
import {Box} from '@sanity/ui'

import {type FieldPreviewComponent} from '../../../preview'
import {slugWrapper} from './SlugPreview.css'

export const SlugPreview: FieldPreviewComponent<Slug> = (props) => {
  const {value} = props

  return (
    <Box className={slugWrapper} paddingX={2} paddingY={1}>
      {value.current}
    </Box>
  )
}
