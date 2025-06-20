import {UserAvatar} from '../../../components/userAvatar/UserAvatar'

interface Props {
  id: string
}

const User = (props: Props) => {
  const {id} = props
  return <UserAvatar user={id} withTooltip />
}

export default User
