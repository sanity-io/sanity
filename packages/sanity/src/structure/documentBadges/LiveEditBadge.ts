import {type DocumentBadgeComponent} from 'sanity'

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentBadgeComponent`
/** @internal */
export const useLiveEditBadge: DocumentBadgeComponent = (props) => {
  const {liveEditSchemaType, version} = props

  if (liveEditSchemaType && !version) {
    return {
      label: 'Live',
      color: 'danger',
    }
  }

  return null
}
useLiveEditBadge.displayName = 'LiveEditBadge'
