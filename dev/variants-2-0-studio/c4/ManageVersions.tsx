import {DocumentsIcon} from '@sanity/icons/Documents'
import {Box, Button, Flex, Text} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'

import {Popover} from '../../../packages/sanity/src/ui-components/popover/Popover'
import {BadgeButton, BadgedControl} from '../c3/StateBadge'
import {baseDot} from '../c3/types'
import {VersionsIcon} from '../c3/VersionsIcon'
import {useVersionList} from '../data/useVersionList'
import {useVariantDefinitions} from '../c1/world'
import {SharedInventory} from '../c5/ActionableLenses'
import {useCorpus} from '../c5/useCorpus'

/**
 * C4 option B: the same inventory panel (Andrej's), opened as a popover from a "Manage versions" button. It sits in
 * a thin row under the pane header (the PROPOSED banner slot), right aligned.
 */
export function ManageVersions({documentId, form = 'lane'}: {documentId: string; form?: 'lane' | 'icon'}) {
  const [open, setOpen] = useState(false)
  const versions = useVersionList(documentId, form === 'icon')
  const corpus = useCorpus()
  const definitions = useVariantDefinitions()
  const [button, setButton] = useState<HTMLElement | null>(null)
  const panel = useRef<HTMLDivElement | null>(null)

  // Close on a click outside the button and the panel, and on Esc.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (button?.contains(target) || panel.current?.contains(target)) return
      // The lens's own menus (filter, view, row actions) and its dialogs are portalled outside the panel.
      if ((target as Element).closest?.('[role=menu], [data-ui=MenuButton__popover], [role=dialog], [data-ui=Layer]')) return
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

  const popover = (
      <Popover
        content={
          <Box padding={3} ref={panel} style={{maxHeight: 520, overflow: 'auto', width: 360}}>
            {corpus ? <SharedInventory bare corpus={corpus} definitions={definitions} docId={documentId} /> : <Text muted size={1}>Loading versions…</Text>}
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
  )

  // In the pills row: the same icon and state badge as the list row's versions control.
  if (form === 'icon') {
    return (
      <span data-testid="manage-versions" ref={setButton} style={{display: 'inline-flex'}}>
        <BadgedControl dot={versions ? baseDot(versions) : null}>
          <BadgeButton
            aria-label="Manage versions"
            icon={VersionsIcon}
            mode="bleed"
            onClick={() => setOpen((v) => !v)}
            selected={open}
            tooltipProps={{content: 'Manage versions'}}
          />
        </BadgedControl>
        {popover}
      </span>
    )
  }

  // Without the C2 pills there is no row to put the icon in, so it gets a thin row of its own.
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
      {popover}
    </Flex>
  )
}
