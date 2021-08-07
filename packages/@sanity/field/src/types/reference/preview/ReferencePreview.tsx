// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {Reference} from '@sanity/types'
import React from 'react'
import Preview from 'part:@sanity/base/preview'
import styled from 'styled-components'
import {Box} from '@sanity/ui'
import {PreviewComponent} from '../../../preview/types'

const ReferenceWrapper = styled.div`
  word-wrap: break-word;
`

export const ReferencePreview: PreviewComponent<Reference> = ({value, schemaType}) => (
  <Box as={ReferenceWrapper} padding={2}>
    <Preview type={schemaType} value={value} layout="default" />
  </Box>
)
