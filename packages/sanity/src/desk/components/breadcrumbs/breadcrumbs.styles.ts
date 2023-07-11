import styled from 'styled-components'
import {Button, Text} from '@sanity/ui'

export const Root = styled.ol`
  margin: 0;
  padding: 0;
  display: flex;
  list-style: none;
  align-items: center;
  white-space: nowrap;
  line-height: 0;
`

export const ExpandButton = styled(Button)`
  appearance: none;
  margin: -4px;
`

export const BreadcrumbItem = styled(Text)<{lastItem?: boolean}>`
  ${(props) => (props.lastItem ? 'min-width: 220px;' : 'max-width: 130px;')}
`
