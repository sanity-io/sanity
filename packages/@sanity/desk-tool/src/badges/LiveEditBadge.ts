export function LiveEditBadge(props) {
  return props.liveEdit
    ? {
        label: 'Live',
        color: 'danger'
      }
    : null
}
