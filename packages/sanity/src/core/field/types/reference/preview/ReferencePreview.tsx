import {type Reference} from '@sanity/types'
import {Box} from '@sanity/ui'
import {styled} from 'styled-components'

import {Preview} from '../../../../preview/components/Preview'
import {type FieldPreviewComponent} from '../../../preview'

const ReferenceWrapper = styled.div`
  word-wrap: break-word;
`

export const ReferencePreview: FieldPreviewComponent<Reference> = ({value, schemaType}) => (
  <Box as={ReferenceWrapper} padding={2}>
    <Preview schemaType={schemaType} value={value} layout="default" />
  </Box>
)
