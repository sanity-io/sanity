import React from 'react'
import type {CommandListItemProps} from './types'

/**
 * @internal
 */
export function CommandListItem({
  activeIndex = -1,
  children,
  fixedHeight,
  measure,
  onChildMouseDown,
  onChildMouseEnter,
  virtualRow,
  ...rest
}: CommandListItemProps) {
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
