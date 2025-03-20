import {ChevronDownIcon} from '@sanity/icons'
import {type Placement, useClickOutsideEvent} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'

import {Button} from '../../../../../../../../ui-components/button/Button'
import {Popover} from '../../../../../../../../ui-components/popover/Popover'
import {useTranslation} from '../../../../../../../i18n/hooks/useTranslation'
import {POPOVER_RADIUS, POPOVER_VERTICAL_MARGIN} from '../../../constants'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {documentTypesTruncated} from '../../../utils/documentTypesTruncated'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {DocumentTypesPopoverContent} from './DocumentTypesPopoverContent'

const FALLBACK_PLACEMENTS: Placement[] = ['top-start', 'bottom-start']

export function DocumentTypesButton() {
  const [open, setOpen] = useState(false)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const {
    state: {
      fullscreen,
      terms: {types},
    },
  } = useSearchState()
  const {t} = useTranslation()

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])

  useClickOutsideEvent(handleClose, () => [buttonElement, popoverRef.current])

  const title = useMemo(() => documentTypesTruncated({types, t}), [types, t])

  return (
    <Popover
      __unstable_margins={[POPOVER_VERTICAL_MARGIN, 0, 0, 0]}
      content={
        <FilterPopoverWrapper anchorElement={buttonElement} onClose={handleClose}>
          <DocumentTypesPopoverContent />
        </FilterPopoverWrapper>
      }
      open={open}
      placement="bottom-start"
      fallbackPlacements={FALLBACK_PLACEMENTS}
      portal
      radius={POPOVER_RADIUS}
      ref={popoverRef}
    >
      <Button
        iconRight={ChevronDownIcon}
        mode="ghost"
        onClick={handleOpen}
        size={fullscreen ? 'large' : 'default'}
        ref={setButtonElement}
        selected={open}
        text={title}
        tone="default"
      />
    </Popover>
  )
}
