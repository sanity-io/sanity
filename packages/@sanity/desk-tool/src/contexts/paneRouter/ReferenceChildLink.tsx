import React, {forwardRef} from 'react'
import {toString as pathToString} from '@sanity/util/paths'
import {ChildLink} from './ChildLink'
import {ReferenceChildLinkProps} from './types'

export const ReferenceChildLink = forwardRef(function ReferenceChildLink(
  {documentId, documentType, parentRefPath, children, ...rest}: ReferenceChildLinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return (
    <ChildLink
      {...rest}
      ref={ref}
      childId={documentId}
      childParameters={{
        type: documentType,
        parentRefPath: pathToString(parentRefPath),
      }}
    >
      {children}
    </ChildLink>
  )
})
