import React from 'react'
import {PortableTextBlock, PortableTextFeatures} from '../../types/portableText'
import {DefaultListItem, DefaultListItemInner} from '.'

type Props = {
  children: JSX.Element
  block: PortableTextBlock
  portableTextFeatures: PortableTextFeatures
}
export default function TextBlock(props: Props) {
  const {portableTextFeatures, children, block} = props
  const style = block.style || portableTextFeatures.styles[0].value
  // Should we render a custom style?
  // TODO: Look into this API. This is legacy support for older Sanity Studio versions via the type
  let CustomStyle
  const blockStyle =
    portableTextFeatures && style
      ? portableTextFeatures.styles.find((item) => item.value === style)
      : undefined
  if (blockStyle) {
    CustomStyle = blockStyle.blockEditor && blockStyle.blockEditor.render
  }

  let renderedBlock = children
  if ('listItem' in block && block.listItem) {
    renderedBlock = (
      <DefaultListItem
        listStyle={block.listItem || portableTextFeatures.lists[0].value}
        listLevel={block.level || 0}
      >
        <DefaultListItemInner>{renderedBlock}</DefaultListItemInner>
      </DefaultListItem>
    )
  }
  return (
    <>
      {!CustomStyle && renderedBlock}
      {CustomStyle && <CustomStyle style={style}>{renderedBlock}</CustomStyle>}
    </>
  )
}
