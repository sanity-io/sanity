// eslint-disable-next-line import/named
import {SortableContainerProps, SortableElementProps} from 'react-sortable-hoc'

export type ListComponent = React.ForwardRefExoticComponent<React.HTMLProps<HTMLUListElement>>
export type ItemComponent = React.ForwardRefExoticComponent<React.HTMLProps<HTMLLIElement>>

export type SortableListProps = SortableContainerProps & React.HTMLProps<HTMLUListElement>
export type SortableListComponent = React.ForwardRefExoticComponent<SortableListProps>

export type SortableItemProps = SortableElementProps & React.HTMLProps<HTMLUListElement>
export type SortableItemComponent = React.ForwardRefExoticComponent<SortableItemProps>

export type DragHandleProps = React.HTMLProps<HTMLDivElement>
export type DragHandleComponent = React.ForwardRefExoticComponent<DragHandleProps>
