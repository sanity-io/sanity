import styled from 'styled-components'

const Thing = styled.div`
  background: #fe0;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
`

export function StyledTestView() {
  // throw new Error('called?')

  return (
    <Thing key="test">
      Styled with <code>styled-components</code>
    </Thing>
  )
}
