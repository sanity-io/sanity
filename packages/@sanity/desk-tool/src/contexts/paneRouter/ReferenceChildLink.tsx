import React, {forwardRef} from 'react'
import {toString as pathToString} from '@sanity/util/paths'
import {ChildLink} from './ChildLink'
import {ReferenceChildLinkProps} from './types'

export const ReferenceChildLink = forwardRef(function ReferenceChildLink(
  {documentId, documentType, parentRefPath, children, template, ...rest}: ReferenceChildLinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return (
    <ChildLink
      {...rest}
      ref={ref}
      childId={documentId}
      childPayload={template?.params}
      childParameters={{
        type: documentType,
        parentRefPath: pathToString(parentRefPath),
        ...(template && {template: template?.id}),
      }}
    >
      {children}
    </ChildLink>
  )
})
