import EditIcon from './icons/edit'

export function DraftStatusBadge(props) {
  return props.draft
    ? {
        label: 'Draft',
        color: 'warning',
        icon: EditIcon
      }
    : null
}
