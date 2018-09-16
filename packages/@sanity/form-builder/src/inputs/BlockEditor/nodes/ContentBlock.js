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
  SlateChange,
  SlateValue
} from '../typeDefs'
import ListItem from './ListItem'
import Text from './Text'

type Props = {
  block: ?(Block | FormBuilderValue),
  blockActions?: Node,
  blockContentFeatures: BlockContentFeatures,
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
    children,
    editorValue,
    markers,
    node,
    onChange,
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
    return (
      <ListItem listStyle={listItem} level={level}>
        <Text style={style} attributes={attributes} styleComponent={styleComponent}>
          {children}
        </Text>
        {((markers && markers.length > 0) || blockActions) && (
          <BlockExtras
            markers={markers}
            onFocus={onFocus}
            onChange={onChange}
            block={block}
            editorValue={editorValue}
            blockActions={blockActions}
            renderCustomMarkers={renderCustomMarkers}
          />
        )}
      </ListItem>
    )
  }
  return (
    <Text style={style} styleComponent={styleComponent} attributes={attributes}>
      {children}
      {((markers && markers.length > 0) || blockActions) && (
        <BlockExtras
          markers={markers}
          onFocus={onFocus}
          onChange={onChange}
          block={block}
          editorValue={editorValue}
          blockActions={blockActions}
          renderCustomMarkers={renderCustomMarkers}
        />
      )}
    </Text>
  )
}
