import type {DocumentBadgeComponent} from '@sanity/base'

export const PublishedStatusBadge: DocumentBadgeComponent = (props) => {
  return props.published
    ? {
        label: 'Published',
        color: 'success',
      }
    : null
}
