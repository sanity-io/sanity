import {type ForwardedRef, forwardRef} from 'react'
import {getPublishedId} from 'sanity'
import {type IntentJsonParams, type IntentParameters, IntentLink} from 'sanity/router'
import {type ChildLinkProps} from 'sanity/structure'

/**
 * Opens a child document in the structure tool (new tab) when it is not part of the
 * presentation preview surface.
 */
export const StructureIntentChildLink = forwardRef(function StructureIntentChildLink(
  props: ChildLinkProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const {childId, childParameters, childPayload, children, ...rest} = props
  const childType = childParameters?.type

  if (!childType) {
    return null
  }

  const intentParams = {
    ...childParameters,
    id: getPublishedId(childId),
    mode: 'structure',
  }

  const params: IntentParameters =
    childPayload !== undefined ? [intentParams, childPayload as IntentJsonParams] : intentParams

  return (
    <IntentLink
      {...rest}
      ref={ref}
      intent="edit"
      params={params}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </IntentLink>
  )
})
