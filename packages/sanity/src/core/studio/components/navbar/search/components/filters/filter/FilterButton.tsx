import {CloseIcon} from '@sanity/icons'
import {
  // eslint-disable-next-line no-restricted-imports
  Button, // Button with specific styling and children behavior.
  Card,
  rem,
  useClickOutsideEvent,
useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type KeyboardEvent, useCallback, useRef, useState} from 'react'

import {Popover} from '../../../../../../../../ui-components'
import {useTranslation} from '../../../../../../../i18n'
import {POPOVER_RADIUS, POPOVER_VERTICAL_MARGIN} from '../../../constants'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {type SearchFilter} from '../../../types'
import {getFilterKey, validateFilter} from '../../../utils/filterUtils'
import {FilterLabel} from '../../common/FilterLabel'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {FilterPopoverContent} from './FilterPopoverContent'

import {assignInlineVars} from '@vanilla-extract/dynamic'
import {closeButton as closeButtonClass, closeCard as closeCardClass, containerDiv, labelButton as labelButtonClass, radiusVar} from './FilterButton.css'

interface FilterButtonProps {
  filter: SearchFilter
  initialOpen?: boolean
}

export function FilterButton({filter, initialOpen}: FilterButtonProps) {
  const {radius} = useThemeV2()
  const [open, setOpen] = useState(initialOpen)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const {
    dispatch,
    state: {definitions, fullscreen},
  } = useSearchState()

  const {t} = useTranslation()

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])
  const handleRemove = useCallback(
    () =>
      dispatch({
        filterKey: getFilterKey(filter),
        type: 'TERMS_FILTERS_REMOVE',
      }),
    [dispatch, filter],
  )
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (['Backspace', 'Delete'].includes(event.key)) {
        handleRemove()
      }
    },
    [handleRemove],
  )

  useClickOutsideEvent(handleClose, () => [buttonElement, popoverRef.current])

  const isValid = validateFilter({
    fieldDefinitions: definitions.fields,
    filter,
    filterDefinitions: definitions.filters,
    operatorDefinitions: definitions.operators,
  })

  return (
    <Popover
      __unstable_margins={[POPOVER_VERTICAL_MARGIN, 0, 0, 0]}
      content={
        <FilterPopoverWrapper anchorElement={buttonElement} onClose={handleClose}>
          <FilterPopoverContent filter={filter} />
        </FilterPopoverWrapper>
      }
      constrainSize
      open={open}
      overflow="auto"
      placement="bottom-start"
      portal
      radius={POPOVER_RADIUS}
      ref={popoverRef}
    >
      <div className={containerDiv}>
        <Card
          __unstable_focusRing
          display="flex"
          radius={2}
          tone={isValid ? 'primary' : 'transparent'}
        >
          <Button
            className={labelButtonClass}
            mode="bleed"
            onClick={handleOpen}
            onKeyDown={handleKeyDown}
            paddingLeft={fullscreen ? 3 : 2}
            paddingRight={fullscreen ? 3 : 5}
            paddingY={fullscreen ? 3 : 2}
            ref={setButtonElement}
          >
            <FilterLabel filter={filter} showContent={isValid} />
          </Button>
        </Card>

        {!fullscreen && (
          <Card
            className={closeCardClass}
            __unstable_focusRing
            display="flex"
            radius={2}
            tone={isValid ? 'primary' : 'transparent'}
          >
            <Button
              className={closeButtonClass}
              style={assignInlineVars({[radiusVar]: `0 ${rem(radius[2])} ${rem(radius[2])} 0`})}
              aria-label={t('search.action.remove-filter-aria-label')}
              fontSize={1}
              icon={CloseIcon}
              mode="bleed"
              onClick={handleRemove}
              onKeyDown={handleKeyDown}
              padding={2}
              radius={2}
            />
          </Card>
        )}
      </div>
    </Popover>
  )
}
