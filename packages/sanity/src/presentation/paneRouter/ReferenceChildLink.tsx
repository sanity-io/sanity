import {type RefAttributes} from 'react'
import {getPublishedId, pathToString} from 'sanity'
import {type ReferenceChildLinkProps} from 'sanity/structure'

import {type PresentationSearchParams} from '../types'
import {ChildLink} from './ChildLink'

export function ReferenceChildLink(
  props: ReferenceChildLinkProps & {
    searchParams: PresentationSearchParams
  } & RefAttributes<HTMLAnchorElement>,
) {
  const {ref, documentId, documentType, parentRefPath, template, searchParams, ...rest} = props

  return (
    <ChildLink
      {...rest}
      ref={ref}
      childId={getPublishedId(documentId)}
      childType={documentType}
      childPayload={template?.params}
      childParameters={{
        parentRefPath: pathToString(parentRefPath),
        ...(template && {template: template?.id}),
      }}
      searchParams={searchParams}
    />
  )
}
