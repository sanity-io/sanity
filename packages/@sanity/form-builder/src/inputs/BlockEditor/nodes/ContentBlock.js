// @flow
import type {SlateComponentProps} from '../typeDefs'

import React from 'react'

import ListItem from './ListItem'
import Text from './Text'

export default function ContentBlock(props: SlateComponentProps) {
  const {attributes, children, node, blockContentFeatures} = props
  const data = node.data
  const listItem = data ? data.get('listItem') : null
  const level = data ? data.get('level') : 1
  const style = data ? data.get('style') : 'normal'

  // Should be render a custom style?
  let Style
  const customStyle =
    blockContentFeatures && style
      ? blockContentFeatures.styles.find(item => item.value === style)
      : null
  if (customStyle) {
    Style = customStyle.blockEditor && customStyle.blockEditor.render
  }

  if (listItem) {
    return (
      <ListItem listStyle={listItem} level={level}>
        <Text style={style} attributes={attributes} Style={Style}>
          {children}
        </Text>
      </ListItem>
    )
  }
  return (
    <Text style={style} Style={Style} attributes={attributes}>
      {children}
    </Text>
  )
}
