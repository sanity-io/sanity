import React from 'react'
import {Element} from 'slate'
import {PortableTextFeatures} from '../../types/portableText'
import {DraggableBlock} from '../DraggableBlock'

type Props = {
  element: Element
  portableTextFeatures: PortableTextFeatures
  readOnly: boolean
}
export default class TextBlock extends React.Component<Props> {
  render() {
    const {portableTextFeatures, children, element, readOnly} = this.props
    const style = typeof element.style === 'string' ? element.style : 'normal'
    // Should we render a custom style?
    let CustomStyle
    const blockStyle =
      portableTextFeatures && style
        ? portableTextFeatures.styles.find((item) => item.value === style)
        : undefined
    if (blockStyle) {
      // TODO: Look into this API.
      CustomStyle = blockStyle.blockEditor && blockStyle.blockEditor.render
    }
    return (
      <DraggableBlock element={element} readOnly={readOnly}>
        <>
          {!CustomStyle && children}
          {CustomStyle && <CustomStyle style={style}>{children}</CustomStyle>}
        </>
      </DraggableBlock>
    )
  }
}
