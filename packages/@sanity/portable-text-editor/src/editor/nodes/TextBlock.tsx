import React from 'react'
import {Element} from 'slate'
import {PortableTextFeatures} from '../../types/portableText'
import {DraggableBlock} from '../DraggableBlock'
import {DefaultListItem, DefaultListItemInner} from '.'

type Props = {
  blockRef: React.MutableRefObject<HTMLDivElement | null>
  children: JSX.Element
  element: Element
  portableTextFeatures: PortableTextFeatures
  readOnly: boolean
}
export default function TextBlock(props: Props) {
  const {blockRef, portableTextFeatures, children, element, readOnly} = props
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
    <DraggableBlock element={element} readOnly={readOnly} blockRef={blockRef}>
      <>
        {!CustomStyle && renderedBlock}
        {CustomStyle && <CustomStyle style={style}>{renderedBlock}</CustomStyle>}
      </>
    </DraggableBlock>
  )
}
