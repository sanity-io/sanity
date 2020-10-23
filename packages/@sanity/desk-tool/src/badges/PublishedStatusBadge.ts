export function PublishedStatusBadge(props) {
  return props.published
    ? {
        label: 'Published',
        color: 'success',
      }
    : null
}
