import styled from 'styled-components'

const IFrame = styled.iframe`
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
`

export function IFrameView() {
  return <IFrame src="https://www.sanity.io/" />
}
