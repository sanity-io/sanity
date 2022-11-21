import {Reference} from '@sanity/types'
import React from 'react'
import styled from 'styled-components'
import {Box} from '@sanity/ui'

import {FieldPreviewComponent} from '../../../preview'
import {Preview} from '../../../../preview/components/Preview'

const ReferenceWrapper = styled.div`
  word-wrap: break-word;
`

export const ReferencePreview: FieldPreviewComponent<Reference> = ({value, schemaType}) => (
  <Box as={ReferenceWrapper} padding={2}>
    <Preview schemaType={schemaType} value={value} layout="default" />
  </Box>
)
