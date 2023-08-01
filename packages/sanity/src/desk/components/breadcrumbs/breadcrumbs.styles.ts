import styled from 'styled-components'
import {Box, Button} from '@sanity/ui'

export const BREADCRUMB_ITEM_TITLE_MIN_WIDTH = 220
export const BREADCRUMB_ITEM_MAX_WIDTH = 130

export const Root = styled.ol`
  margin: 0;
  padding: 0;
  display: inline-flex;
  list-style: none;
  align-items: center;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  line-height: 0;
`

export const ExpandButton = styled(Button)`
  appearance: none;
`

export const BreadcrumbItemRoot = styled(Box)`
  max-width: ${BREADCRUMB_ITEM_MAX_WIDTH}px;

  :last-child {
    min-width: ${BREADCRUMB_ITEM_TITLE_MIN_WIDTH}px;
    max-width: inherit;
  }
`
