import {CloseIcon} from '@sanity/icons/Close'
import {Box, Flex, TextInput} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {type ChangeEvent, type KeyboardEvent, useCallback, useState} from 'react'

import {Button} from '../../../../ui-components'

/**
 * A value in the chip editor. `id` is a stable local key so a rename (editing a chip in place) can
 * be told apart from a remove-plus-add by callers that track value identity.
 *
 * @internal
 */
export interface ValueChip {
  id: string
  value: string
}

/**
 * A compact, wrapping editor for a dimension's values. Each value is an inline editable field with
 * a remove control, and a trailing field adds more — typing or pasting a comma-separated list
 * splits it into chips, so bulk entry ("uk, us, de") still works while every value stays
 * individually editable. Replaces the old stacked full-width inputs that grew unbounded.
 *
 * @internal
 */
export function ValueChipsInput(props: {
  chips: ValueChip[]
  onChange: (chips: ValueChip[]) => void
  ariaLabel: string
  addPlaceholder: string
  removeLabel: string
}) {
  const {chips, onChange, ariaLabel, addPlaceholder, removeLabel} = props
  const [draft, setDraft] = useState('')

  const commit = useCallback(
    (text: string, remainder: string) => {
      const additions = text
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)

      if (additions.length > 0) {
        const existing = new Set(chips.map((chip) => chip.value))
        const next = [...chips]
        for (const value of additions) {
          if (!existing.has(value)) {
            existing.add(value)
            next.push({id: randomKey(12), value})
          }
        }
        onChange(next)
      }

      setDraft(remainder)
    },
    [chips, onChange],
  )

  const handleDraftChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value
      if (value.includes(',')) {
        const lastComma = value.lastIndexOf(',')
        commit(value.slice(0, lastComma), value.slice(lastComma + 1))
      } else {
        setDraft(value)
      }
    },
    [commit],
  )

  const handleDraftKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && draft.trim()) {
        event.preventDefault()
        commit(draft, '')
      }
    },
    [commit, draft],
  )

  const handleChipChange = useCallback(
    (id: string, value: string) => {
      onChange(chips.map((chip) => (chip.id === id ? {...chip, value} : chip)))
    },
    [chips, onChange],
  )

  const handleRemove = useCallback(
    (id: string) => {
      onChange(chips.filter((chip) => chip.id !== id))
    },
    [chips, onChange],
  )

  return (
    <Flex align="center" gap={2} wrap="wrap">
      {chips.map((chip) => (
        <Flex key={chip.id} align="center" gap={1} style={{width: 'min(160px, 100%)'}}>
          <Box flex={1}>
            <TextInput
              aria-label={ariaLabel}
              data-testid="value-chip-input"
              fontSize={1}
              onChange={(event) => handleChipChange(chip.id, event.currentTarget.value)}
              padding={2}
              radius={2}
              value={chip.value}
            />
          </Box>
          <Button
            data-testid="value-chip-remove"
            icon={CloseIcon}
            mode="bleed"
            onClick={() => handleRemove(chip.id)}
            tone="critical"
            tooltipProps={{content: removeLabel}}
            type="button"
          />
        </Flex>
      ))}
      <Box style={{width: 'min(160px, 100%)'}}>
        <TextInput
          aria-label={addPlaceholder}
          data-testid="value-chip-add"
          fontSize={1}
          onBlur={() => draft.trim() && commit(draft, '')}
          onChange={handleDraftChange}
          onKeyDown={handleDraftKeyDown}
          padding={2}
          placeholder={addPlaceholder}
          radius={2}
          value={draft}
        />
      </Box>
    </Flex>
  )
}
