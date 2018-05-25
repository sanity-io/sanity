// @flow
import type {SlateComponentProps} from '../typeDefs'

import React from 'react'

import ListItem from './ListItem'
import Text from './Text'

type ExtraProps = {
  blockContentFeatures: BlockContentFeatures,
  hasFormBuilderFocus: boolean,
  markers: Marker[],
  readOnly: ?boolean
}

export default function ContentBlock(props: SlateComponentProps & ExtraProps) {
  const {attributes, children, node, blockContentFeatures} = props
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
      </ListItem>
    )
  }
  return (
    <Text style={style} styleComponent={styleComponent} attributes={attributes}>
      {children}
    </Text>
  )
}
