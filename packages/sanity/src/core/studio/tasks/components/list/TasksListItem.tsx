import {ThreadCard} from './styles'

interface TasksListItemProps {
  children: React.ReactNode
}

export function TasksListItem({children}: TasksListItemProps) {
  return <ThreadCard tone={undefined}>{children}</ThreadCard>
}
