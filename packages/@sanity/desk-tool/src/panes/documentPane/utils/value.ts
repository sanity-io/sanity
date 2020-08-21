import {Doc, DocumentPaneOptions} from '../types'

export function getInitialValue(props: {initialValue?: Doc; options: DocumentPaneOptions}): Doc {
  const {initialValue = {}, options} = props
  const base = {_type: options.type}

  return initialValue ? {...base, ...initialValue} : base
}
