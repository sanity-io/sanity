import {type Reference} from '@sanity/types'
import {styled} from 'styled-components'
import {Box} from 'ui5'

import {Preview} from '../../../../preview/components/Preview'
import {type FieldPreviewComponent} from '../../../preview/types'

const ReferenceWrapper = styled.div`
  word-wrap: break-word;
`

export const ReferencePreview: FieldPreviewComponent<Reference> = ({value, schemaType}) => (
  <Box as={ReferenceWrapper} padding={2}>
    <Preview schemaType={schemaType} value={value} layout="default" />
  </Box>
)
