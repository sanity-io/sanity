// @flow
import type {Block, SlateComponentProps, SlateChange, SlateValue} from '../typeDefs'

import React from 'react'

import BlockExtras from 'part:@sanity/form-builder/input/block-editor/block-extras'
import ListItem from './ListItem'
import Text from './Text'

type ExtraProps = {
  blockContentFeatures: BlockContentFeatures,
  editorValue: SlateValue,
  hasFormBuilderFocus: boolean,
  markers: Marker[],
  onFocus: void => void,
  onChange: (change: SlateChange) => void,
  block: Block,
  readOnly: ?boolean
}

export default function ContentBlock(props: SlateComponentProps & ExtraProps) {
  const {
    attributes,
    block,
    blockContentFeatures,
    children,
    editorValue,
    markers,
    node,
    onChange,
    onFocus
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
        <BlockExtras
          markers={markers}
          onFocus={onFocus}
          onChange={onChange}
          block={block}
          editorValue={editorValue}
        />
      </ListItem>
    )
  }
  return (
    <Text style={style} styleComponent={styleComponent} attributes={attributes}>
      {children}
      <BlockExtras
        markers={markers}
        onFocus={onFocus}
        onChange={onChange}
        block={block}
        editorValue={editorValue}
      />
    </Text>
  )
}
