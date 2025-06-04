import {TrashIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import {useCallback} from 'react'
import {type FormPatch} from 'sanity'
import {styled} from 'styled-components'

import {getRemoveColumnPatch} from './tablePatches'
import {type Column, type HeaderRow} from './types'

const FloatingButtons = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
  display: none;
  gap: 4px;
`

export const Header = styled.th`
  padding: 4px 0;
  text-align: left;
  background-color: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  white-space: nowrap;
  & span[data-border] {
    box-shadow: none !important;
    background: #f8fafc !important;
  }
  position: relative;

  &:hover {
    ${FloatingButtons} {
      display: flex;
    }
  }
`
const DragHandleButton = styled(Button)`
  cursor: move;
`

export function HeaderCell(props: {
  column: Column
  children: React.ReactNode
  onChange: (patch: FormPatch) => void
  headerRow: HeaderRow
}) {
  const {column, children, onChange, headerRow} = props
  const handleRemoveColumn = useCallback(() => {
    onChange(getRemoveColumnPatch(headerRow, column))
  }, [column, headerRow, onChange])

  return (
    <Header>
      <FloatingButtons>
        {/* <DragHandleButton mode="ghost" icon={DragHandleIcon} space={2} padding={2} /> */}
        <Button
          mode="ghost"
          iconRight={TrashIcon}
          onClick={handleRemoveColumn}
          space={2}
          padding={2}
        />
      </FloatingButtons>
      {children}
    </Header>
  )
}
