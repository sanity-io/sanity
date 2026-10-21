import {type DocumentActionComponent} from 'sanity'

import {useVariantDefinitions} from '../c1/world'
import {useOption} from '../design-options/store'
import {usePaneAddress} from './usePaneAddress'

// Open beta header (spec B5): an action that writes names its target. Publish says the pane's variant ("Publish France"). The stock label is plain
// "Publish"; only that label is replaced, and only while the open beta header (c2 C) is on.
const cache = new WeakMap<DocumentActionComponent, DocumentActionComponent>()

export function namingTarget(original: DocumentActionComponent): DocumentActionComponent {
  const known = cache.get(original)
  if (known) return known
  const named: DocumentActionComponent = function useNamedAction(props) {
    const description = original(props)
    const header = useOption('c2') === 'c'
    const {held, local, global} = usePaneAddress()
    const definitions = useVariantDefinitions()
    if (!description || !header || description.label !== 'Publish') return description
    const shown = held ? local : global
    const variant =
      shown.variant === 'none'
        ? undefined
        : definitions.find((d) => d._id.replace(/^_\.variants\./, '') === shown.variant)?.metadata
            ?.title
    return variant ? {...description, label: `Publish ${variant}`} : description
  }
  named.action = original.action
  cache.set(original, named)
  return named
}
