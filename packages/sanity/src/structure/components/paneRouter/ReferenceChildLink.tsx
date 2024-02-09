import {toString as pathToString} from '@sanity/util/paths'
import type * as React from 'react'
import {forwardRef} from 'react'

import {ChildLink} from './ChildLink'
import {type ReferenceChildLinkProps} from './types'

export const ReferenceChildLink = forwardRef(function ReferenceChildLink(
  {documentId, documentType, parentRefPath, children, template, ...rest}: ReferenceChildLinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>,
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
