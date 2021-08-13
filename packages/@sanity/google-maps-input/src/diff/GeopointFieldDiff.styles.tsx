import styled from 'styled-components'

export const RootContainer = styled.div`
  position: relative;
  min-height: 200px;

  &:empty {
    background-color: var(--card-skeleton-color-from);
    display: table;
    width: 100%;
  }

  &:empty:after {
    content: 'Missing/invalid data';
    display: table-cell;
    vertical-align: middle;
    text-align: center;
    position: relative;
  }
`
