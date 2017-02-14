import React from 'react'
import LinkNode from './LinkNode'

export default function createLinkPreviewNode(ofType) {
  return function WrappedLinkNode(props) {
    return <LinkNode type={ofType} {...props} />
  }
}
