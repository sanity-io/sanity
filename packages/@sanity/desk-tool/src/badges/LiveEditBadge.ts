import LiveIcon from './icons/live'

export function LiveEditBadge(props) {
  return props.liveEdit
    ? {
        label: 'Live document',
        color: 'success',
        icon: LiveIcon
      }
    : null
}
