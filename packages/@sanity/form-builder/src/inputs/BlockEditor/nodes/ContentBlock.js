// @flow
import type {Node} from 'react'
import React from 'react'

import BlockExtras from 'part:@sanity/form-builder/input/block-editor/block-extras'
import type {
  Block,
  BlockContentFeatures,
  FormBuilderValue,
  Marker,
  Path,
  SlateComponentProps,
  SlateController,
  SlateChange,
  SlateValue
} from '../typeDefs'
import ListItem from './ListItem'
import Text from './Text'
import styles from './styles/ContentBlock.css'

type Props = {
  block: ?(Block | FormBuilderValue),
  blockActions?: Node,
  blockContentFeatures: BlockContentFeatures,
  controller: SlateController,
  editorValue: SlateValue,
  markers: Marker[],
  onChange: (change: SlateChange, callback?: (SlateChange) => void) => void,
  onFocus: Path => void,
  renderCustomMarkers?: (Marker[]) => Node
}

// eslint-disable-next-line complexity
export default function ContentBlock(props: Props & SlateComponentProps) {
  const {
    attributes,
    block,
    blockContentFeatures,
    controller,
    children,
    editorValue,
    markers,
    node,
    onFocus,
    blockActions,
    renderCustomMarkers
  } = props
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
    let blockExtras = null
    if ((markers && markers.length > 0) || blockActions) {
      blockExtras = (
        <BlockExtras
          block={block}
          blockActions={blockActions}
          controller={controller}
          editorValue={editorValue}
          markers={markers}
          onFocus={onFocus}
          renderCustomMarkers={renderCustomMarkers}
        />
      )
    }
    return (
      <ListItem
        attributes={attributes}
        blockExtras={blockExtras}
        level={level}
        listStyle={listItem}
      >
        <Text style={style} styleComponent={styleComponent}>
          {children}
        </Text>
      </ListItem>
    )
  }
  return (
    <div className={styles.textBlock} {...attributes}>
      <Text style={style} styleComponent={styleComponent}>
        {children}
      </Text>
      {((markers && markers.length > 0) || blockActions) && (
        <BlockExtras
          block={block}
          blockActions={blockActions}
          controller={controller}
          editorValue={editorValue}
          markers={markers}
          onFocus={onFocus}
          renderCustomMarkers={renderCustomMarkers}
        />
      )}
    </div>
  )
}
