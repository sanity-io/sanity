import EditIcon from 'part:@sanity/base/edit-icon'

export function DraftStatusBadge(props) {
  return props.draft
    ? {
        label: 'Draft',
        color: 'warning',
        icon: EditIcon
      }
    : null
}
