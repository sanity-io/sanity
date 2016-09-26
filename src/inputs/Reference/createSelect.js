import React from 'react'
import ReferenceSelect from './select/ReferenceSelect'
import ValueContainer from './common/ValueContainer'
import Fieldset from 'part:@sanity/components/fieldsets/default'

export default function createReferenceSelect({fetchAll, materializeReferences}) {

  ReferenceInput.propTypes = ReferenceSelect.propTypes
  ReferenceInput.valueContainer = ValueContainer

  return ReferenceInput

  function ReferenceInput(props) {
    return (
      <Fieldset legend={props.field.title} level={props.level}>
        <ReferenceSelect
          fetchAllFn={fetchAll}
          materializeReferences={materializeReferences}
          {...props}
        />
      </Fieldset>
    )
  }
}
