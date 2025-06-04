import {styled} from 'styled-components'

export const Header = styled.th`
  padding: 4px 0;
  text-align: left;
  background-color: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  white-space: nowrap;
  & span[data-border] {
    box-shadow: none !important;
    background: #f8fafc !important;
  }
  position: relative;
`
