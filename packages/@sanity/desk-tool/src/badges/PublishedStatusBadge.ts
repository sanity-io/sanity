import PublishIcon from './icons/publish'

export function PublishedStatusBadge(props) {
  return props.published
    ? {
        label: 'Published',
        color: 'success',
        icon: PublishIcon
      }
    : null
}
