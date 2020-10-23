export function DraftStatusBadge(props) {
  return props.draft
    ? {
        label: 'Draft',
        color: 'warning',
      }
    : null
}
