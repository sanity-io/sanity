import {studioTheme} from '@sanity/ui'
import styled from 'styled-components'

// TODO: How can we easily render inline text with differing font-weights in Sanity UI?
export const SemiboldSpan = styled.span`
  font-weight: ${studioTheme.fonts.text.weights.semibold};
`
