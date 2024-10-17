import {type DocumentBadgeComponent} from 'sanity'

/** @internal */
export const LiveEditBadge: DocumentBadgeComponent = (props) => {
  const {liveEditSchemaType} = props

  if (liveEditSchemaType) {
    // TODO: i18n.
    return {
      label: 'Live',
      color: 'danger',
    }
  }

  return null
}
LiveEditBadge.displayName = 'LiveEditBadge'
