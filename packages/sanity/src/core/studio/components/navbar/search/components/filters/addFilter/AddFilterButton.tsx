import {AddIcon} from '@sanity/icons'
import {Button, Popover} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {POPOVER_RADIUS, POPOVER_VERTICAL_MARGIN} from '../../../constants'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {useTranslation} from '../../../../../../../i18n'
import {AddFilterPopoverContent} from './AddFilterPopoverContent'

export function AddFilterButton() {
  const [open, setOpen] = useState(false)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const {t} = useTranslation()

  const {
    state: {fullscreen},
  } = useSearchState()

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])

  return (
    <Popover
      __unstable_margins={[POPOVER_VERTICAL_MARGIN, 0, 0, 0]}
      content={
        <FilterPopoverWrapper anchorElement={buttonElement} onClose={handleClose}>
          <AddFilterPopoverContent onClose={handleClose} />
        </FilterPopoverWrapper>
      }
      open={open}
      placement="bottom-start"
      radius={POPOVER_RADIUS}
      portal
    >
      <Button
        fontSize={1}
        icon={AddIcon}
        mode="bleed"
        onClick={handleOpen}
        padding={fullscreen ? 3 : 2}
        ref={setButtonElement}
        selected={open}
        space={2}
        text={t('search.action.add-filter')}
      />
    </Popover>
  )
}
