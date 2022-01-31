import styled from 'styled-components'

export const DialogBody = styled.div`
  box-sizing: border-box;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  height: 100%;

  & > *:not(:last-child) {
    margin-bottom: 1.25rem;
  }
`

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
`
