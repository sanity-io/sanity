import {FieldPresence, FormFieldPresence} from '@sanity/base/presence'
import React, {useCallback} from 'react'
import {Box, Card, Flex} from '@sanity/ui'
import {FormFieldValidationStatus} from '@sanity/base/components'
import {Marker, Path, SchemaType} from '@sanity/types'
import {DragHandle} from '../common/DragHandle'
import PatchEvent, {set} from '../../../PatchEvent'
import {ItemWithMissingType} from '../ArrayOfObjectsInput/item/ItemWithMissingType'
import {FormBuilderInput} from '../../../FormBuilderInput'
import {ConfirmDeleteButton} from '../ArrayOfObjectsInput/ConfirmDeleteButton'
import getEmptyValue from './getEmptyValue'

const dragHandle = <DragHandle paddingX={2} paddingY={3} />

type Props = {
  type?: SchemaType
  onChange: (event: PatchEvent) => void
  onRemove: (item: number) => void
  onEnterKey: (item: number) => void
  onEscapeKey: (item: number) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  focusPath: Path
  markers: Marker[]
  index: number
  value: string | number | boolean
  compareValue?: (string | number | boolean)[]
  isSortable: boolean
  readOnly?: boolean | null
  level: number
  presence: FormFieldPresence[]
}

export const ItemRow = React.forwardRef(function ItemRow(
  props: Props,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const focusRef = React.useRef<FormBuilderInput>(null)
  const {
    isSortable,
    value,
    index,
    compareValue,
    level,
    onEscapeKey,
    onEnterKey,
    onFocus,
    onChange,
    onBlur,
    onRemove,
    focusPath,
    markers,
    type,
    readOnly,
    presence,
  } = props

  const handleRemove = useCallback(() => {
    onRemove(index)
  }, [index, onRemove])

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        onEnterKey(index)
      }
    },
    [index, onEnterKey]
  )

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<any>) => {
      if (event.shiftKey && event.key === 'Backspace' && value === '') {
        onRemove(index)
      }

      if (event.key === 'Escape') {
        onEscapeKey(index)
      }
    },
    [index, onEscapeKey, onRemove, value]
  )

  const handleChange = useCallback(
    (patchEvent: PatchEvent) => {
      onChange(
        PatchEvent.from(
          patchEvent.patches.map((
            patch // Map direct unset patches to empty value instead in order to not *remove* elements as the user clears out the value
          ) =>
            patch.path.length === 0 && patch.type === 'unset' && type
              ? set(getEmptyValue(type))
              : patch
          )
        ).prefixAll(index)
      )
    },
    [index, onChange, type]
  )

  const handleMissingTypeFocus = useCallback(() => onFocus([]), [onFocus])

  return (
    <Card border radius={1} padding={1} ref={ref}>
      <Flex align="center">
        {isSortable && <Box marginRight={1}>{dragHandle}</Box>}

        {type ? (
          <Card radius={1} flex={1} marginRight={2}>
            <FormBuilderInput
              ref={focusRef}
              value={value}
              path={[index]}
              compareValue={compareValue}
              markers={markers}
              focusPath={focusPath}
              onFocus={onFocus}
              onBlur={onBlur}
              type={type}
              readOnly={readOnly}
              level={level}
              presence={presence}
              onKeyUp={handleKeyUp}
              onKeyPress={handleKeyPress}
              onChange={handleChange}
            />
          </Card>
        ) : (
          <Box flex={1}>
            <ItemWithMissingType value={value} onFocus={handleMissingTypeFocus} />
          </Box>
        )}

        <Flex align="center">
          {!readOnly && markers.length > 0 && (
            <Box marginLeft={2}>
              <FormFieldValidationStatus __unstable_markers={markers} />
            </Box>
          )}

          {!type?.title && (
            // if title is set on type, presence avatars will be shown in the input' formfield instead
            <Box marginLeft={3} style={{minWidth: '1.5em'}}>
              {!readOnly && presence.length > 0 && (
                <FieldPresence presence={presence} maxAvatars={1} />
              )}
            </Box>
          )}

          {!readOnly && onRemove && (
            <Box marginLeft={1}>
              <ConfirmDeleteButton placement="left" title="Remove item" onConfirm={handleRemove} />
            </Box>
          )}
        </Flex>
      </Flex>
    </Card>
  )
})
