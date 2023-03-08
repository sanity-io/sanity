import {VirtualItem} from '@tanstack/react-virtual'
import React, {ReactNode} from 'react'
import {useCommandList} from './useCommandList'

interface CommandListItemProps {
  activeIndex: number
  children: ReactNode
  fixedHeight?: boolean
  measure?: (node: Element | null) => void
  virtualRow: VirtualItem
}

/**
 * @internal
 */
export function CommandListItem({
  activeIndex = -1,
  children,
  fixedHeight,
  measure,
  virtualRow,
  ...rest
}: CommandListItemProps) {
  const {onChildMouseDown, onChildMouseEnter} = useCommandList()

  return (
    <div
      onMouseDown={onChildMouseDown}
      onMouseEnter={onChildMouseEnter(activeIndex)}
      ref={measure}
      style={{
        flex: 1,
        ...(fixedHeight ? {height: `${virtualRow.size}px`} : {}),
        left: 0,
        position: 'absolute',
        top: 0,
        transform: `translateY(${virtualRow.start}px)`,
        width: '100%',
      }}
      // Ensure propagation of aria / data attrs
      {...rest}
    >
      {children}
    </div>
  )
}
