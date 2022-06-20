import React from 'react'
import {Box} from '@sanity/ui'
import styled from 'styled-components'
import {PreviewWrapper} from '../PreviewWrapper'

export function Layout({children}) {
  return <PreviewWrapper>{children}</PreviewWrapper>
}
