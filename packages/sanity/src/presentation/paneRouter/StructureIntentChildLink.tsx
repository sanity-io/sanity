import {type ForwardedRef, forwardRef} from 'react'
import {getPublishedId} from 'sanity'
import {IntentLink} from 'sanity/router'
import {type ChildLinkProps} from 'sanity/structure'

/**
 * Opens a child document in the structure tool (new tab) when it is not part of the
 * presentation preview surface.
 */
export const StructureIntentChildLink = forwardRef(function StructureIntentChildLink(
  props: ChildLinkProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const {childId, childParameters, children, ...rest} = props
  const childType = childParameters?.type
  const path = childParameters?.path

  if (!childType) {
    return null
  }

  return (
    <IntentLink
      {...rest}
      ref={ref}
      intent="edit"
      params={{
        id: getPublishedId(childId),
        type: childType,
        mode: 'structure',
        ...(path ? {path} : {}),
        ...childParameters,
        ...(childParameters?.template ? {template: childParameters.template} : {}),
        ...(childParameters?.parentRefPath ? {parentRefPath: childParameters.parentRefPath} : {}),
      }}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </IntentLink>
  )
})
