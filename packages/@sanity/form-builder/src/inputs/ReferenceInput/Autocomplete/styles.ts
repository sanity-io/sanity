import styled from 'styled-components'
import {Card} from '@sanity/ui'

export const Root = styled.div`
  position: relative;
`

export const ListBoxContainer = styled.div`
  position: relative;
`

export const ListBoxCard = styled(Card)`
  position: absolute;
  top: 0;
  left: 1px;
  right: 1px;
  z-index: 1000;
  max-height: calc(100vh - 10em);
  overflow: auto;
  -webkit-overflow-scrolling: touch;

  & > ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
`
