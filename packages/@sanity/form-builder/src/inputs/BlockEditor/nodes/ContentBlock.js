// @flow
import type {SlateComponentProps, SlateChange, SlateValue} from '../typeDefs'

import React from 'react'

import Markers from 'part:@sanity/form-builder/input/block-editor/block-markers'
import ListItem from './ListItem'
import Text from './Text'
import listItemStyles from './styles/ListItem.css'

type ExtraProps = {
  blockContentFeatures: BlockContentFeatures,
  editorValue: SlateValue,
  hasFormBuilderFocus: boolean,
  markers: Marker[],
  onFocus: void => void,
  onChange: (change: SlateChange) => void,
  readOnly: ?boolean
}

export default function ContentBlock(props: SlateComponentProps & ExtraProps) {
  const {
    attributes,
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
        <div className={listItemStyles.markerWrapper} contentEditable={false}>
          <Markers
            markers={markers}
            onFocus={onFocus}
            onChange={onChange}
            editorValue={editorValue}
          />
        </div>
      </ListItem>
    )
  }
  return (
    <Text style={style} styleComponent={styleComponent} attributes={attributes}>
      {children}
      <Markers
        markers={markers}
        contentEditable={false}
        editorValue={editorValue}
        onFocus={onFocus}
        onChange={onChange}
      />
    </Text>
  )
}
