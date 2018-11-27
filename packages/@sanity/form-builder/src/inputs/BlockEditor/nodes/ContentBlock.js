// @flow
import type {Node} from 'react'
import React from 'react'

import type {
  Block,
  BlockContentFeatures,
  FormBuilderValue,
  Marker,
  Path,
  SlateComponentProps,
  SlateEditor
} from '../typeDefs'
import ListItem from './ListItem'
import Text from './Text'
import styles from './styles/ContentBlock.css'

type Props = {
  block: ?(Block | FormBuilderValue),
  blockActions?: Node,
  blockContentFeatures: BlockContentFeatures,
  editor: SlateEditor,
  markers: Marker[],
  onFocus: Path => void,
  renderCustomMarkers?: (Marker[]) => Node
}

// eslint-disable-next-line complexity
export default class Markers extends React.Component<Props & SlateComponentProps> {
  _clickCounter = 0
  _clickTimeout = null

  handleMouseDown = () => {
    if (this._clickTimeout) {
      clearTimeout(this._clickTimeout)
    }
    this._clickTimeout = setTimeout(() => {
      if (this._clickCounter > 2) {
        this.props.editor.moveToRangeOfNode(this.props.editor.value.anchorBlock)
      }
      this._clickCounter = 0
    }, 500)
    this._clickCounter++
  }

  render() {
    const {attributes, blockContentFeatures, children, node} = this.props
    const data = node.data
    const listItem = data ? data.get('listItem') : null
    const level = data ? data.get('level') : 1
    const style = data ? data.get('style') : 'normal'

    // Should we render a custom style?
    let styleComponent
    const customStyle =
      blockContentFeatures && style
        ? blockContentFeatures.styles.find(item => item.value === style)
        : null
    if (customStyle) {
      styleComponent = customStyle.blockEditor && customStyle.blockEditor.render
    }

    if (listItem) {
      return (
        <ListItem attributes={attributes} level={level} listStyle={listItem}>
          <Text style={style} styleComponent={styleComponent}>
            <div onMouseDown={this.handleMouseDown}>{children}</div>
          </Text>
        </ListItem>
      )
    }
    return (
      <div className={styles.textBlock} {...attributes} onMouseDown={this.handleMouseDown}>
        <Text style={style} styleComponent={styleComponent}>
          {children}
        </Text>
      </div>
    )
  }
}
