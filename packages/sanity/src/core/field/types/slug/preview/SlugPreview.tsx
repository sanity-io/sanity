import {type Slug} from '@sanity/types'
import {Box} from 'ui5'

import {type FieldPreviewComponent} from '../../../preview/types'
import {slugWrapper} from './SlugPreview.css'

export const SlugPreview: FieldPreviewComponent<Slug> = (props) => {
  const {value} = props

  return (
    <Box className={slugWrapper} paddingX={2} paddingY={1}>
      {value.current}
    </Box>
  )
}
