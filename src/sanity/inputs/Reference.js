import React from 'react'
import {createReferenceInput} from 'role:@sanity/form-builder'
import client from 'client:@sanity/base/client'
import {unprefixType} from '../utils/unprefixType'
import debounce from 'debounce-promise'

function fetchSingle(id) {
  return client.fetch('*[.$id == %id]', {id}).then(response => unprefixType(response.result[0]))
}
function createHit(document) {
  return {document}
}

const ReferenceInput = createReferenceInput({
  search: debounce((query, field) => {
    const toField = field.to[0]
    if (!toField.searchField) {
      throw new TypeError(`Unable to peform search: No "searchField" specified on reference type for "${field.name}". Check your schema.`)
    }
    return client.fetch(`*[.$type == %type && .${toField.searchField} == %q]`, {
      type: `beerfiesta.${toField.type}`,
      q: query
    })
    .then(response => response.result.map(unprefixType).map(createHit))
  }, 200),

  materializeReferences(referenceIds) {
    return Promise.all(referenceIds.map(fetchSingle))
  }
})

export default function Reference(props) {
  return (
    <div>
      <ReferenceInput {...props} />
      <div style={{fontSize: 10}}>[Only exact matches are supported for now!]</div>
    </div>
  )
}
Reference.valueContainer = ReferenceInput.valueContainer