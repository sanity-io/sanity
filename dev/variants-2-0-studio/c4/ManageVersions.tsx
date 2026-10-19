import {DocumentsIcon} from '@sanity/icons/Documents'
import {Box, Button, Flex} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'

import {Popover} from '../../../packages/sanity/src/ui-components/popover/Popover'
import {LiveInventory} from './inventory/LiveInventory'

/**
 * C4 option B: the same inventory panel (Andrej's), opened as a popover from a "Manage versions" button. It sits in
 * a thin row under the pane header (the PROPOSED banner slot), right aligned.
 */
export function ManageVersions({documentId}: {documentId: string}) {
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLElement | null>(null)
  const panel = useRef<HTMLDivElement | null>(null)

  // Close on a click outside the button and the panel, and on Esc.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (button?.contains(target) || panel.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, button])

  return (
    <Flex data-testid="manage-versions" justify="flex-end" paddingX={3} paddingY={1}>
      <Button
        fontSize={1}
        icon={DocumentsIcon}
        mode="ghost"
        onClick={() => setOpen((v) => !v)}
        padding={2}
        ref={setButton}
        selected={open}
        style={{height: 25}}
        text="Manage versions"
      />
      <Popover
        content={
          <Box ref={panel} style={{height: 520, overflow: 'auto', width: 360}}>
            <LiveInventory documentId={documentId} title={documentId} />
          </Box>
        }
        floatingBoundary={document.body}
        open={open}
        padding={0}
        placement="bottom-end"
        portal
        radius={3}
        referenceBoundary={document.body}
        referenceElement={button}
        shadow={3}
      />
    </Flex>
  )
}
