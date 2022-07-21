import {LegacyLayerProvider} from '@sanity/base/components'
import {Box, Card, Dialog, Portal, useGlobalKeyDown, useLayer} from '@sanity/ui'
import React, {useCallback, useEffect, useRef} from 'react'
import FocusLock from 'react-focus-lock'
import styled from 'styled-components'
import {SearchContent} from './components/SearchContent'
import {SearchHeader} from './components/SearchHeader'
import {TypeFilters} from './components/TypeFilters'
import {useSearchState} from './contexts/search'

interface SearchDialogProps {
  onClose: () => void
}

export function SearchDialog({onClose}: SearchDialogProps) {
  return (
    <LegacyLayerProvider zOffset="navbarPopover">
      <Portal>
        <FocusLock>
          <SearchDialogContent onClose={onClose} />
        </FocusLock>
      </Portal>
    </LegacyLayerProvider>
  )
}

function SearchDialogContent({onClose}: {onClose: () => void}) {
  const {isTopLayer} = useLayer()

  useGlobalKeyDown((e) => {
    if (!isTopLayer || !onClose) return

    if (e.key === 'Escape') {
      onClose()
    }
  })

  return (
    <FullscreenWrapper scheme="light" tone="default">
      <StickyBox flex={1}>
        <SearchHeader onClose={onClose} />
      </StickyBox>
      <Box>
        <SearchContent onClose={onClose} />
        <SearchDialogFilters />
      </Box>
    </FullscreenWrapper>
  )
}

function SearchDialogFilters() {
  const {
    dispatch,
    state: {filtersVisible},
  } = useSearchState()

  const dialogRef = useRef<HTMLDivElement>(null)

  // Always hide filters on mount
  useEffect(() => {
    dispatch({type: 'FILTERS_HIDE'})
  }, [dispatch])

  // Force dialogs to be 100% height
  // TODO: there has to be a better way to do this
  useEffect(() => {
    if (dialogRef?.current?.parentElement?.parentElement) {
      dialogRef.current.parentElement.parentElement.style.height = '100%'
    }
  }, [filtersVisible, dialogRef])

  const handleClose = useCallback(() => {
    dispatch({type: 'FILTERS_HIDE'})
  }, [dispatch])

  if (!filtersVisible) {
    return null
  }

  return (
    <FocusLock>
      <Dialog
        cardRadius={1}
        contentRef={dialogRef}
        header="Filter"
        height="fill"
        id="search-filter"
        onClose={handleClose}
        width={2}
      >
        <Card tone="default">
          <TypeFilters />
        </Card>
      </Dialog>
    </FocusLock>
  )
}

const FullscreenWrapper = styled(Card)`
  left: 0;
  min-height: 100vh;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 1;
`

const StickyBox = styled(Box)`
  position: sticky;
  top: 0;
  z-index: 1;
`
