import {stringify} from 'querystring'
import {useMemo} from 'react'
import styled from 'styled-components'
import {PortableTextEditor, usePortableTextEditor, usePortableTextEditorSelection} from '../../lib'
import {ToolbarContainer} from './containers'

export const DecoratorButton = styled.button`
  background-color: ${(props: {active: boolean}) => (props.active ? '#ccc' : '#fff')};
  margin-right: 0.1em;
  border: 1px solid #999;
`

export function Toolbar() {
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
  const decorators = useMemo(
    (): {title: string; value: string; active: boolean}[] =>
      ptFeatures.decorators.map((dec: {title: string; value: string}) => ({
        ...dec,
        active: PortableTextEditor.isMarkActive(editor, dec.value),
      })),
    [selection]
  )
  function toggleMark(mark) {
    PortableTextEditor.toggleMark(editor, mark)
  }
  return (
    <ToolbarContainer>
      {decorators.map((dec) => {
        return (
          <DecoratorButton
            active={dec.active}
            key={`toolbar-button-${dec.value}`}
            onClick={toggleMark.bind(this, dec.value)}
          >
            {dec.title}
          </DecoratorButton>
        )
      })}
    </ToolbarContainer>
  )
}
