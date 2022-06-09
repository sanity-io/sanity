import type {DocumentBadgeComponent} from '../types'

export const LiveEditBadge: DocumentBadgeComponent = (props) => {
  const {liveEdit} = props

  if (liveEdit) {
    return {
      label: 'Live',
      color: 'danger',
    }
  }

  return null
}
