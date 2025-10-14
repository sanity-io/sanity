import {ChevronDownIcon, CopyIcon, TrashIcon, UploadIcon} from '@sanity/icons'
import {type Path} from '@sanity/types'
import {Card, Checkbox, Flex, Inline, Menu, Text} from '@sanity/ui'
import {type ReactNode, useCallback} from 'react'
import {css, styled} from 'styled-components'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {useCopyPaste} from '../../../../studio'
import {useGetFormValue} from '../../../contexts/GetFormValue'
import {type FormDocumentValue} from '../../../types'

interface SelectionToolbarProps {
  invalidItemKeys: string[]
  selectedItemKeys: string[]
  path: Path
  id: string
  allKeys: string[]
  selectActive?: boolean
  onItemSelect: (
    item: string,
    options?: {shiftKey?: boolean; metaKey?: boolean; force?: boolean},
  ) => void
  onItemUnselect: (item: string) => void
  onSelectedItemsRemove: () => void
  readOnly?: boolean
  onSelectEnd: () => void
  onSelectBegin: () => void
  canUpload: boolean
  children?: ReactNode
}

const StickyCard = styled(Card)<{sticky?: boolean}>`
  ${(props) =>
    props.sticky
      ? css`
          position: sticky;
          top: 1px;
          z-index: 400;
        `
      : ``}
`

export function SelectionToolbar(props: SelectionToolbarProps) {
  const {
    invalidItemKeys,
    selectedItemKeys,
    onItemSelect,
    onItemUnselect,
    allKeys,
    path,
    readOnly,
    id,
    onSelectedItemsRemove,
    canUpload,
  } = props

  const handleSelectInvalid = useCallback(() => {
    invalidItemKeys.forEach((key) => onItemSelect(key, {force: true}))
  }, [invalidItemKeys, onItemSelect])

  const handleSelectAll = useCallback(() => {
    allKeys.forEach((key) => onItemSelect(key, {force: true}))
  }, [allKeys, onItemSelect])

  const handleSelectNone = useCallback(() => {
    selectedItemKeys.forEach((key) => onItemUnselect(key))
  }, [onItemUnselect, selectedItemKeys])

  const selectActive = selectedItemKeys.length > 0
  const allSelected = selectedItemKeys.length > 0 && selectedItemKeys.length === allKeys.length
  const itemTxt = (len: number) => <>item{len === 1 ? '' : 's'}</>

  const {onCopy} = useCopyPaste()
  const getFormValue = useGetFormValue()

  const handleCopySelection = useCallback(async () => {
    const selectedPaths: Path[] = selectedItemKeys.map((itemKey) => [{_key: itemKey}])
    await onCopy(path, getFormValue([]) as FormDocumentValue, {
      selection: selectedPaths,
      context: {source: 'unknown'},
    })
  }, [getFormValue, onCopy, path, selectedItemKeys])

  return (
    <StickyCard
      sticky={selectActive}
      display="flex"
      tone={selectActive ? 'primary' : 'inherit'}
      borderBottom
      padding={2}
    >
      <>
        <Flex flex={1} gap={3} align="center" justify="flex-start">
          <Inline space={2}>
            <Flex as="label" padding={1}>
              <Checkbox
                disabled={allKeys.length === 0}
                readOnly={readOnly}
                indeterminate={!allSelected && selectedItemKeys.length > 0}
                checked={allSelected}
                onChange={allSelected ? handleSelectNone : handleSelectAll}
              />
            </Flex>
            {false && (
              <MenuButton
                id={`${id}-selectMenuButton`}
                button={
                  <Button
                    disabled={allKeys.length === 0}
                    mode="bleed"
                    icon={ChevronDownIcon}
                    tooltipProps={{
                      zOffset: 500,
                      portal: true,
                      content: 'Select…',
                    }}
                  />
                }
                menu={
                  <Menu>
                    <MenuItem
                      text={`Select all (${allKeys.length})`}
                      disabled={allSelected}
                      onClick={handleSelectAll}
                    />
                    <MenuItem
                      text="Select none"
                      disabled={selectedItemKeys.length === 0}
                      onClick={handleSelectNone}
                    />
                    {invalidItemKeys.length > 0 ? (
                      <MenuItem
                        text={`Select invalid (${invalidItemKeys.length})`}
                        disabled={invalidItemKeys.length === 0}
                        onClick={handleSelectInvalid}
                      />
                    ) : null}
                  </Menu>
                }
                popover={{portal: true, tone: 'default'}}
              />
            )}
          </Inline>
          {selectActive ? (
            <Inline space={1}>
              <Text size={1} muted>
                {selectedItemKeys.length} {itemTxt(selectedItemKeys.length)} selected
              </Text>
            </Inline>
          ) : null}
        </Flex>
        <Flex gap={2} align="center">
          {selectedItemKeys.length ? (
            <>
              <Button
                mode="bleed"
                icon={CopyIcon}
                text="Copy"
                tooltipProps={{
                  zOffset: 500,

                  portal: true,
                  content: (
                    <Text size={1}>
                      Copy {selectedItemKeys.length} {itemTxt(selectedItemKeys.length)}
                    </Text>
                  ),
                }}
                onClick={handleCopySelection}
              />
              <Button
                tone="critical"
                mode="bleed"
                icon={TrashIcon}
                text="Remove"
                tooltipProps={{
                  zOffset: 500,

                  portal: true,
                  content: (
                    <Text size={1}>
                      Remove {selectedItemKeys.length} {itemTxt(selectedItemKeys.length)}
                    </Text>
                  ),
                }}
                onClick={onSelectedItemsRemove}
              />
            </>
          ) : null}

          {selectActive || !canUpload ? null : (
            // eslint-disable-next-line no-alert
            <Button mode="bleed" text="Upload" icon={UploadIcon} onClick={() => alert('Todo ;)')} />
          )}
          {selectActive ? null : <>{props.children}</>}
        </Flex>
      </>
    </StickyCard>
  )
}
