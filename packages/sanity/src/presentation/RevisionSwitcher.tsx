import {type FunctionComponent} from 'react'
import {useEditState} from 'sanity'

import {type PresentationNavigate} from './types'
import {useEffectOnChange} from './util/useEffectOnChange'

interface RevisionSwitcherProps {
  documentId: string
  documentRevision: string | undefined
  documentType: string
  navigate: PresentationNavigate
  perspective: 'previewDrafts' | 'published'
}

/**
 * Renderless component to handle displaying the correct revision when the
 * perspective is switched. When the perspective changes to 'published', the
 * `rev` parameter correpsonding to the published document is resolved from the
 * published edit state. When the perspective changes to 'previewDrafts', the
 * `rev` parameter is removed, as the latest draft should be displayed.
 * @internal
 */
export const RevisionSwitcher: FunctionComponent<RevisionSwitcherProps> = function (props) {
  const {documentId, documentType, navigate, perspective, documentRevision} = props

  const editState = useEditState(documentId, documentType)

  useEffectOnChange(perspective, (value) => {
    let rev: string | undefined = undefined
    if (value === 'published' && editState.published) {
      const {_updatedAt, _rev} = editState.published
      rev = `${_updatedAt}/${_rev}`
    }
    if (documentRevision !== rev) {
      navigate({}, {rev}, true)
    }
  })

  return null
}
