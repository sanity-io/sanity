/// <reference types="react" />
import {SortableContainerProps, SortableElementProps} from 'react-sortable-hoc'
export declare type ListComponent = React.ForwardRefExoticComponent<
  React.HTMLProps<HTMLUListElement>
>
export declare type ItemComponent = React.ForwardRefExoticComponent<React.HTMLProps<HTMLLIElement>>
export declare type SortableListProps = SortableContainerProps & React.HTMLProps<HTMLUListElement>
export declare type SortableListComponent = React.ForwardRefExoticComponent<SortableListProps>
export declare type SortableItemProps = SortableElementProps & React.HTMLProps<HTMLUListElement>
export declare type SortableItemComponent = React.ForwardRefExoticComponent<SortableItemProps>
export declare type DragHandleProps = React.HTMLProps<HTMLDivElement>
export declare type DragHandleComponent = React.ForwardRefExoticComponent<DragHandleProps>
