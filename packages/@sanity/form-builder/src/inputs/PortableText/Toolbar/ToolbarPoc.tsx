import React from 'react'
import {PortableTextEditor, EditorSelection} from '@sanity/portable-text-editor'
import DefaultButton from 'part:@sanity/components/buttons/default'
import styles from './Toolbar.css'

type Props = {
  editor: PortableTextEditor
  selection: EditorSelection
  onToggleFullscreen: () => void
  isFullscreen: boolean
}

export default class PortableTextEditorToolbar extends React.PureComponent<Props, {}> {
  handleToggleMark = () => {
    const {editor} = this.props
    PortableTextEditor.toggleMark(editor, 'strong')
  }
  handleToggleFullscreen = event => {
    event.preventDefault()
    this.props.onToggleFullscreen()
  }
  isSelected = (mark: string) => {
    const {editor} = this.props
    if (!editor) {
      return false
    }
    return PortableTextEditor.isMarkActive(editor, mark)
  }
  render() {
    const {editor} = this.props
    if (!editor) {
      return null
    }
    const rootClassNames = [
      styles.root,
      ...(this.props.isFullscreen ? [styles.fullscreen] : [])
    ].join(' ')
    return (
      <div className={rootClassNames}>
        <DefaultButton onClick={this.handleToggleMark} inverted={!this.isSelected('strong')}>
          Strong
        </DefaultButton>
        <DefaultButton onClick={this.handleToggleFullscreen} inverted={!this.props.isFullscreen}>
          Fullscreen
        </DefaultButton>
      </div>
    )
  }
}
