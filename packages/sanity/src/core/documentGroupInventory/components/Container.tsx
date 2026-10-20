import {styled} from 'styled-components'

export const Container = styled.div`
  display: grid;
  grid-template-rows: min-content minmax(0, 1fr) min-content;
  block-size: 100%;
  min-block-size: 0;
`
