import PublishIcon from 'part:@sanity/base/publish-icon'

export function PublishedStatusBadge(props) {
  return props.published
    ? {
        label: 'Published',
        color: 'success',
        icon: PublishIcon
      }
    : null
}
