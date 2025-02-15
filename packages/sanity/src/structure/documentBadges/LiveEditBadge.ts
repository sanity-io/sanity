import {type DocumentBadgeComponent} from 'sanity'

/** @internal */
export const LiveEditBadge: DocumentBadgeComponent = (props) => {
  const {liveEditSchemaType, version} = props

  if (liveEditSchemaType && !version) {
    return {
      label: 'Live',
      color: 'danger',
    }
  }

  return null
}
LiveEditBadge.displayName = 'LiveEditBadge'
