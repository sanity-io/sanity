import {type IncomingReferencesOptions} from '@sanity/types'

import {type StringInputProps} from '../../../types/inputProps'
import {IncomingReferencesList} from './IncomingReferencesList'

/**
 * @beta
 */
export function IncomingReferencesInput(
  props: StringInputProps & {schemaType: {options: IncomingReferencesOptions}},
) {
  const {id: fieldName, schemaType} = props
  const {
    onLinkDocument,
    actions,
    filter,
    filterParams,
    creationAllowed = true,
    types,
  } = schemaType.options as IncomingReferencesOptions

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
