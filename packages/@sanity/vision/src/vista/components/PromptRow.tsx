import {CloseIcon} from '@sanity/icons/Close'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {Button, TextInput} from '@sanity/ui'
import {type KeyboardEvent} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../i18n'

export interface PromptRowProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onClose: () => void
  /** While generating, the field and the button wait */
  pending: boolean
  /** `-request` and `-submit` are added for the field and the button */
  testIdPrefix: string
}

/** A description to generate from, with the button that generates: Enter submits, Escape closes */
export function PromptRow(props: PromptRowProps) {
  const {label, placeholder, value, onChange, onSubmit, onClose, pending, testIdPrefix} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    } else if (event.key === 'Enter' && !pending) {
      event.preventDefault()
      onSubmit()
    }
  }
  return (
    <Flex alignItems="center" gap={2}>
      <Box flexBasis="0%" flexGrow={1} minWidth="0">
        <TextInput
          aria-label={label}
          // Password managers ignore `autoComplete` and offer names in a field like this (example
          // descriptions mention first and last names), so each of them also gets its own opt-out
          autoComplete="off"
          autoFocus
          data-1p-ignore
          data-bwignore
          data-form-type="other"
          data-lpignore="true"
          data-testid={`${testIdPrefix}-request`}
          disabled={pending}
          fontSize={1}
          icon={SparklesIcon}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          padding={2}
          placeholder={placeholder}
          value={value}
        />
      </Box>
      <Button
        data-testid={`${testIdPrefix}-submit`}
        disabled={!value.trim() || pending}
        fontSize={1}
        loading={pending}
        onClick={onSubmit}
        padding={2}
        text={t('vista.generate.submit')}
        tone="primary"
      />
      <Button
        aria-label={t('vista.generate.close')}
        fontSize={1}
        icon={CloseIcon}
        mode="bleed"
        onClick={onClose}
        padding={2}
      />
    </Flex>
  )
}
