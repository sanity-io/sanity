import type {DocumentBadgeComponent} from '@sanity/base'

export const DraftStatusBadge: DocumentBadgeComponent = (props) => {
  return props.draft
    ? {
        label: 'Draft',
        color: 'warning',
      }
    : null
}
