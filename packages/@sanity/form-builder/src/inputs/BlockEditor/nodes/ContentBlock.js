// @flow
import type {SlateComponentProps} from '../typeDefs'

import React from 'react'

import MarkerWrapper from 'part:@sanity/form-builder/input/block-editor/block-marker-wrapper'
import ListItem from './ListItem'
import Text from './Text'

type ExtraProps = {
  blockContentFeatures: BlockContentFeatures,
  hasFormBuilderFocus: boolean,
  markers: Marker[],
  readOnly: ?boolean
}

export default function ContentBlock(props: SlateComponentProps & ExtraProps) {
  const {attributes, children, node, blockContentFeatures, markers} = props
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
      <MarkerWrapper markers={markers}>
        <ListItem listStyle={listItem} level={level}>
          <Text style={style} attributes={attributes} styleComponent={styleComponent}>
            {children}
          </Text>
        </ListItem>
      </MarkerWrapper>
    )
  }
  return (
    <MarkerWrapper markers={markers}>
      <Text style={style} styleComponent={styleComponent} attributes={attributes}>
        {children}
      </Text>
    </MarkerWrapper>
  )
}
