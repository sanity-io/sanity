import {TranslateIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Popover,
  Stack,
  Text,
  useClickOutsideEvent,
} from '@sanity/ui'
import {type FormEvent, useCallback, useRef, useState} from 'react'
import {type ObjectSchemaType} from 'sanity'

import {type LanguageFilterPluginOptions} from './types'
import {usePaneLanguages} from './usePaneLanguages'

export interface LanguageFilterMenuButtonProps {
  options: LanguageFilterPluginOptions

  // eslint-disable-next-line react/no-unused-prop-types
  schemaType: ObjectSchemaType
}

export function LanguageFilterMenuButton(props: LanguageFilterMenuButtonProps) {
  const {options} = props
  const defaultLanguages = options.supportedLanguages.filter((l) =>
    options.defaultLanguages?.includes(l.id),
  )
  const languageOptions = options.supportedLanguages.filter(
    (l) => !options.defaultLanguages?.includes(l.id),
  )
  const [open, setOpen] = useState(false)
  const {selectableLanguages, selectedLanguages, selectAll, selectNone, toggleLanguage} =
    usePaneLanguages({options})
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const handleToggleAll = useCallback(
    (event: FormEvent<HTMLInputElement>) => {
      const checked = event.currentTarget.checked

      if (checked) {
        selectAll()
      } else {
        selectNone()
      }
    },
    [selectAll, selectNone],
  )

  const handleClick = useCallback(() => setOpen((o) => !o), [])

  useClickOutsideEvent(
    () => setOpen(false),
    () => [buttonRef.current, popoverRef.current],
  )

  const allSelected = selectedLanguages.length === selectableLanguages.length

  const content = (
    <Box overflow="auto" padding={1}>
      {defaultLanguages.length > 0 && (
        <Card radius={2} tone="primary">
          <Stack padding={2} space={3}>
            <Text size={1} weight="semibold">
              Default language{defaultLanguages.length > 1 && <>s</>}
            </Text>

            {defaultLanguages.map((l) => (
              <Text key={l.id}>{l.title}</Text>
            ))}
          </Stack>
        </Card>
      )}

      <Stack marginTop={3} padding={2} space={2}>
        <Box paddingBottom={1}>
          <Text size={1} weight="semibold">
            Show translations
          </Text>
        </Box>

        <Card as="label">
          <Flex align="center" gap={2}>
            <Checkbox checked={allSelected} name="_allSelected" onChange={handleToggleAll} />
            <Box flex={1}>
              <Text muted={!allSelected} weight="semibold">
                All translations
              </Text>
            </Box>
          </Flex>
        </Card>

        {languageOptions.map((lang) => (
          <LanguageFilterOption
            key={lang.id}
            id={lang.id}
            onToggle={toggleLanguage}
            selected={selectedLanguages.includes(lang.id)}
            title={lang.title}
          />
        ))}
      </Stack>
    </Box>
  )

  return (
    <Popover constrainSize content={content} open={open} portal ref={popoverRef}>
      <Button
        icon={TranslateIcon}
        mode="bleed"
        onClick={handleClick}
        ref={buttonRef}
        selected={open}
      />
    </Popover>
  )
}

function LanguageFilterOption(props: {
  id: string
  onToggle: (id: string) => void
  selected: boolean
  title: string
}) {
  const {id, onToggle, selected, title} = props

  const handleChange = useCallback(() => {
    onToggle(id)
  }, [id, onToggle])

  return (
    <Card as="label">
      <Flex align="center" gap={2}>
        <Checkbox checked={selected} name={`language-${id}`} onChange={handleChange} />
        <Box flex={1}>
          <Text muted={!selected}>{title}</Text>
        </Box>
      </Flex>
    </Card>
  )
}
