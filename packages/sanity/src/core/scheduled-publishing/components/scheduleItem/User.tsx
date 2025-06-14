import {UserAvatar} from 'sanity'

interface Props {
  id: string
}

const User = (props: Props) => {
  const {id} = props
  return <UserAvatar user={id} withTooltip />
}

export default User
