import {type StringInputProps} from 'sanity'

import {IncomingReferencesList} from './IncomingReferencesList'
import {type IncomingReferencesOptions} from './types'

/**
 * @beta
 */
export function IncomingReferencesInput(props: StringInputProps & IncomingReferencesOptions) {
  const {
    onLinkDocument,
    actions,
    filter,
    filterParams,
    id: fieldName,
    creationAllowed = true,
    types,
  } = props

  return (
    <IncomingReferencesList
      fieldName={fieldName}
      types={types}
      onLinkDocument={onLinkDocument}
      actions={actions}
      filter={filter}
      filterParams={filterParams}
      creationAllowed={creationAllowed}
    />
  )
}
