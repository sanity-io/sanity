import {Reference} from '@sanity/types'
import React from 'react'
import styled from 'styled-components'
import {Box} from '@sanity/ui'
import {SanityPreview} from '../../../../preview'
import {FieldPreviewComponent} from '../../../preview'

const ReferenceWrapper = styled.div`
  word-wrap: break-word;
`

export const ReferencePreview: FieldPreviewComponent<Reference> = ({value, schemaType}) => (
  <Box as={ReferenceWrapper} padding={2}>
    <SanityPreview schemaType={schemaType} value={value} layout="default" />
  </Box>
)
