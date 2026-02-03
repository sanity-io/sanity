import {ChildLink} from './ChildLink'
import {type ReferenceChildLinkProps} from './types'
import {toString as pathToString} from '@sanity/util/paths'
import {type ForwardedRef, forwardRef} from 'react'
import {getPublishedId} from 'sanity'

export const ReferenceChildLink = forwardRef(function ReferenceChildLink(
  {documentId, documentType, parentRefPath, children, template, ...rest}: ReferenceChildLinkProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  return (
    <ChildLink
      {...rest}
      ref={ref}
      childId={getPublishedId(documentId)}
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
