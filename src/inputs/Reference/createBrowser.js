import React from 'react'
import ReferenceBrowser from './browser/ReferenceBrowser'
import ValueContainer from './common/ValueContainer'
import Fieldset from 'component:@sanity/components/fieldsets/default'

export default function createReferenceInput({fetch, materializeReferences}) {

  ReferenceInput.propTypes = ReferenceBrowser.propTypes
  ReferenceInput.valueContainer = ValueContainer

  return ReferenceInput

  function ReferenceInput(props) {
    return (
      <Fieldset legend={props.field.title}>
        <ReferenceBrowser
          fetchFn={fetch}
          materializeReferences={materializeReferences}
          {...props}
        />
      </Fieldset>
    )
  }
}
