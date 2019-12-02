import * as React from 'react'
import {unpublish} from '../mockDocStateDatastore'

export default function createDocument(state) {
  return null
  return {
    group: 'primary',
    button: () => (
      <button disabled={!state.published} onClick={() => unpublish(state.id, {_type: 'hello'})}>
        Unpublish
      </button>
    )
  }
}
