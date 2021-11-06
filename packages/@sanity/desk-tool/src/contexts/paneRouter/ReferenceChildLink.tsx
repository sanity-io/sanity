import React, {forwardRef} from 'react'
import {toString as pathToString} from '@sanity/util/paths'
import {ChildLink} from './ChildLink'
import {ReferenceChildLinkProps} from './types'

export const ReferenceChildLink = forwardRef(function ReferenceChildLink(
  {
    documentId,
    documentType,
    parentRefPath,
    children,
    template,
    templateParams,
    ...rest
  }: ReferenceChildLinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return (
    <ChildLink
      {...rest}
      ref={ref}
      childId={documentId}
      childParameters={{
        ...(template && {template}),
        type: documentType,
        parentRefPath: pathToString(parentRefPath),
      }}
      childPayload={templateParams}
    >
      {children}
    </ChildLink>
  )
})
