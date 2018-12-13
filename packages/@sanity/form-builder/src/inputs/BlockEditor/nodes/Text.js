// @flow
import type {Node, ComponentType} from 'react'
import React from 'react'

import Blockquote from './Blockquote'
import Header from './Header'
import Normal from './Normal'

const HEADER_STYLES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

type Props = {
  style: string,
  children: Node,
  styleComponent?: ComponentType<*>
}

export default function Text(props: Props) {
  const {style, styleComponent} = props

  if (styleComponent) {
    const CustomStyle = styleComponent
    return <CustomStyle>{props.children}</CustomStyle>
  }

  if (HEADER_STYLES.includes(style)) {
    return <Header style={style}>{props.children}</Header>
  }
  if (style === 'blockquote') {
    return <Blockquote>{props.children}</Blockquote>
  }

  return <Normal>{props.children}</Normal>
}
