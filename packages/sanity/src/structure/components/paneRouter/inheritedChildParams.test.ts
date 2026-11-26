import {describe, expect, it} from 'vitest'

import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../panes/document/constants'
import {getInheritedChildParams} from './inheritedChildParams'

describe('getInheritedChildParams', () => {
  it('carries the document group inventory over to the pane a reference opens', () => {
    expect(getInheritedChildParams({inspect: DOCUMENT_GROUP_INSPECTOR_NAME, view: 'x'})).toEqual({
      inspect: DOCUMENT_GROUP_INSPECTOR_NAME,
    })
  })

  it('carries nothing else, and no other inspector', () => {
    expect(getInheritedChildParams({inspect: 'sanity/comments', rev: '1'})).toEqual({})
    expect(getInheritedChildParams(undefined)).toEqual({})
  })
})
