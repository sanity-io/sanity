import React from 'react'
import {Element} from 'slate'
import {PortableTextFeatures} from '../../types/portableText'
import {DefaultListItem, DefaultListItemInner} from '.'

type Props = {
  children: JSX.Element
  element: Element
  portableTextFeatures: PortableTextFeatures
}
export default function TextBlock(props: Props) {
  const {portableTextFeatures, children, element} = props
  const style = typeof element.style === 'string' ? element.style : 'normal'
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
  if (element.listItem) {
    renderedBlock = (
      <DefaultListItem
        listStyle={(element.listItem as string) || 'bullet'}
        listLevel={(element.level as number) || 0}
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
