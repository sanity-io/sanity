export function LiveEditBadge(props) {
  return props.liveEdit
    ? {
        label: 'Live document',
        color: 'success',
      }
    : null
}
