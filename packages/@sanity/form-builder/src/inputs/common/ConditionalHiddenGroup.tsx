import React from 'react'
import {unstable_useConditionalProperty as useConditionalProperty} from '@sanity/base/hooks'
import {ConditionalProperty} from '@sanity/types'
import {mappedChildren} from '../../utils/common'

type Props = {
  parent?: unknown
  value: unknown
  children?: React.ReactNode
  hidden?: ConditionalProperty
}

export const ConditionalHiddenGroup = ({hidden, ...rest}: Props) => {
  return typeof hidden === 'function' ? (
    <ConditionalHidden {...rest} hidden={hidden} />
  ) : (
    <>{mappedChildren({children: rest.children, childProps: {hidden: hidden}})}</>
  )
}

const ConditionalHidden = (props: Props) => {
  const {hidden, value, parent, children} = props
  const isHidden = useConditionalProperty({
    checkProperty: hidden,
    checkPropertyKey: 'hidden',
    value,
    parent,
  })
  return <>{mappedChildren({children: children, childProps: {hidden: isHidden}})}</>
}
