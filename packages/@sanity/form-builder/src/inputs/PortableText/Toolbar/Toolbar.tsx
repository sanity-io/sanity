import React from 'react'
import {PortableTextEditor, EditorSelection} from '@sanity/portable-text-editor'
import DefaultButton from 'part:@sanity/components/buttons/default'
import styles from './Toolbar.css'

type Props = {
  editor: PortableTextEditor
  selection: EditorSelection
}

export default class PortableTextEditorToolbar extends React.PureComponent<Props, {}> {
  handleToggleMark = () => {
    const {editor} = this.props
    PortableTextEditor.toggleMark(editor, 'strong')
  }
  render() {
    const {editor} = this.props
    if (!editor) {
      return null
    }
    return (
      <div className={styles.root}>
        <DefaultButton
          onClick={this.handleToggleMark}
          inverted={!(editor ? PortableTextEditor.isMarkActive(editor, 'strong') : false)}
        >
          Strong
        </DefaultButton>
      </div>
    )
  }
}
