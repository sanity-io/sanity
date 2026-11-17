import {type Reference} from '@sanity/types'
import {Box} from 'ui5'

import {Preview} from '../../../../preview/components/Preview'
import {type FieldPreviewComponent} from '../../../preview/types'
import {referenceWrapper} from './ReferencePreview.css'

export const ReferencePreview: FieldPreviewComponent<Reference> = ({value, schemaType}) => (
  <Box className={referenceWrapper} padding={2}>
    <Preview schemaType={schemaType} value={value} layout="default" />
  </Box>
)
