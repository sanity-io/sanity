import {styled} from 'styled-components'

export const DialogLayout = styled.div`
  --offset-block: 40px;
  display: grid;
  height: calc(100vh - var(--offset-block));
  min-height: 0;
  overflow: hidden;
  grid-template-areas:
    'header header'
    'previous-document next-document';
  grid-template-columns: 1fr 1fr;
  grid-template-rows: min-content minmax(0, 1fr);
`
