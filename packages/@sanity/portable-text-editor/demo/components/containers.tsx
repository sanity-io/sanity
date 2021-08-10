import styled from 'styled-components'

export const ValueContainer = styled.pre`
  font-size: ${(props: {style: string}) => (props.style === 'small' ? '0.7em' : '0.9em')};
  background: #eee;
  padding: 2em;
`
export const EditorContainer = styled.div`
  width: 500px;
  height: 250px;
  border: 1px solid #ccc;
  overflow-y: scroll;
  padding: 0.5em;
`
export const AppContainer = styled.div`
  font-family: arial;
  font-size: 0.8em;
`

export const ToolbarContainer = styled.div``
