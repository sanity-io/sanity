import {type StringInputProps} from 'sanity'

import {IncomingReferencesList} from './IncomingReferencesList'
import {type IncomingReferencesOptions} from './types'

/**
 * @beta
 */
export function IncomingReferencesInput(props: StringInputProps & IncomingReferencesOptions) {
  const {onLinkDocument, actions, filterQuery, id: fieldName, creationAllowed = true, types} = props

  return (
    <IncomingReferencesList
      types={types}
      onLinkDocument={onLinkDocument}
      actions={actions}
      filterQuery={filterQuery}
      fieldName={fieldName}
      creationAllowed={creationAllowed}
    />
  )
}
