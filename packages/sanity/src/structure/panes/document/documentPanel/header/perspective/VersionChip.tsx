import {useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {memo, type MouseEvent, type ReactNode, useCallback, useMemo, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {type BundleDocument, type releaseType} from '../../../../../../core'
import {Button, Popover, Tooltip} from '../../../../../../ui-components'

const Chip = styled(Button)`
  border-radius: 9999px !important;
  transition: none;
  text-decoration: none !important;
  cursor: pointer;

  // target enabled state
  &:not([data-disabled='true']) {
    --card-border-color: var(--card-badge-default-bg-color);
  }
`

export const VersionChip = memo(function VersionChip(props: {
  disabled?: boolean
  releaseOptions?: BundleDocument[]
  selected: boolean
  tooltipContent: ReactNode
  version?: releaseType
  onClick: () => void
  text: string
  tone: 'default' | 'primary' | 'positive' | 'caution' | 'critical'
  icon: React.ComponentType
  menuContent?: ReactNode
}) {
  const {
    disabled,
    releaseOptions,
    selected,
    tooltipContent,
    version,
    onClick,
    text,
    tone,
    icon,
    menuContent,
  } = props

  const [contextMenuPoint, setContextMenuPoint] = useState<{x: number; y: number} | undefined>(
    undefined,
  )
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const close = useCallback(() => setContextMenuPoint(undefined), [])

  const handleContextMenu = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    setContextMenuPoint({x: event.clientX, y: event.clientY})
  }, [])

  useClickOutsideEvent(close, () => [popoverRef.current])

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (event.key === 'Escape') {
          close()
        }
      },
      [close],
    ),
  )

  const referenceElement = useMemo(() => {
    if (!contextMenuPoint) {
      return null
    }

    return {
      getBoundingClientRect() {
        return {
          x: contextMenuPoint.x,
          y: contextMenuPoint.y,
          left: contextMenuPoint.x,
          top: contextMenuPoint.y,
          right: contextMenuPoint.x,
          bottom: contextMenuPoint.y,
          width: 0,
          height: 0,
        }
      },
    } as HTMLElement
  }, [contextMenuPoint])

  return (
    <>
      <Tooltip content={tooltipContent} fallbackPlacements={[]} portal placement="bottom">
        <Chip
          disabled={disabled}
          mode="bleed"
          onClick={onClick}
          padding={2}
          paddingRight={3}
          radius="full"
          selected={selected}
          style={{flex: 'none'}}
          text={text}
          tone={tone}
          icon={icon}
          onContextMenu={handleContextMenu}
        />
      </Tooltip>

      <Popover
        content={menuContent}
        fallbackPlacements={[]}
        open={Boolean(referenceElement)}
        portal
        placement="bottom-start"
        ref={popoverRef}
        referenceElement={referenceElement}
        zOffset={1000}
      />
    </>
  )
})
