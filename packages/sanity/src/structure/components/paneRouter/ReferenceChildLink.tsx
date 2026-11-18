import {toString as pathToString} from '@sanity/util/paths'
import {type RefAttributes} from 'react'
import {getPublishedId} from 'sanity'

import {ChildLink} from './ChildLink'
import {getInheritedChildParams} from './inheritedChildParams'
import {type ReferenceChildLinkProps} from './types'
import {usePaneRouter} from './usePaneRouter'

export function ReferenceChildLink({
  ref,
  documentId,
  documentType,
  parentRefPath,
  children,
  template,
  ...rest
}: ReferenceChildLinkProps & RefAttributes<HTMLAnchorElement>) {
  const {params} = usePaneRouter()
  return (
    <ChildLink
      {...rest}
      ref={ref}
      childId={getPublishedId(documentId)}
      childPayload={template?.params}
      childParameters={{
        type: documentType,
        parentRefPath: pathToString(parentRefPath),
        ...getInheritedChildParams(params),
        ...(template && {template: template?.id}),
      }}
    >
      {children}
    </ChildLink>
  )
}
