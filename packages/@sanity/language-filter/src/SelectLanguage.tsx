import React, {useState, useCallback} from 'react'
import {Button, Checkbox, Flex, Box, Text, Stack, Popover, useClickOutside} from '@sanity/ui'
import {ChevronDownIcon} from '@sanity/icons'

const ACTION_LABEL = 'Filter languages'
interface LanguageOption {
  title: string
  id: string
}

interface Props {
  languages: LanguageOption[]
  currentDocumentType?: string
  defaultLanguages?: string[]
  documentTypes?: string[]
  selected: string[]
  onChange: (ids: string[]) => void
}

const STYLES_TOGGLE = {flex: 1}
const STYLES_CHECKBOX = {display: 'block'}

const SelectLanguage = ({
  currentDocumentType,
  selected,
  languages,
  defaultLanguages,
  documentTypes,
  onChange,
}: Props) => {
  const [triggerRef, setTriggerRef] = React.useState<HTMLButtonElement | null>(null)
  const [popoverRef, setPopoverRef] = React.useState<HTMLElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const allIsSelected = languages.length === selected.length

  const handleKeyUp = useCallback((e) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }, [])

  const handleOpen = () => {
    setIsOpen((prev) => !prev)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const selectLang = (langId: string) => {
    onChange(selected.concat(langId))
  }

  const unselectLang = (langId: string) => {
    onChange(selected.filter((id) => id !== langId))
  }

  const isDefaultLang = (langId: string) => {
    return defaultLanguages && defaultLanguages.includes(langId)
  }

  const isValidDocumentType = () => {
    return documentTypes && currentDocumentType ? documentTypes.includes(currentDocumentType) : true
  }

  const handleSelectAll = () => {
    onChange(languages.map((language) => language.id))
  }
  const handleSelectNone = () => {
    onChange([])
  }

  const handleLangCheckboxChange = (event: React.FormEvent<HTMLInputElement>) => {
    const id = event.currentTarget.getAttribute('data-lang-id')
    const checked = event.currentTarget.checked

    if (!id) {
      return
    }

    if (checked) {
      selectLang(id)
    } else {
      unselectLang(id)
    }
  }

  useClickOutside(() => {
    handleClose()
  }, [popoverRef, triggerRef])

  if (!isValidDocumentType()) {
    return <></>
  }

  const content = (
    <Box overflow="auto" sizing="border" onKeyUp={handleKeyUp}>
      <Flex padding={2}>
        <Button
          type="button"
          mode="ghost"
          tone="default"
          onClick={allIsSelected ? handleSelectNone : handleSelectAll}
          paddingX={3}
          paddingY={2}
          autoFocus
          style={STYLES_TOGGLE}
        >
          Select {allIsSelected ? 'none' : 'all'}
        </Button>
      </Flex>
      <Box padding={3} paddingX={2}>
        <Stack as="ul" space={3}>
          {languages.map((lang) => {
            const label = lang.title + (isDefaultLang(lang.id) ? ' (Default)' : '')
            const languageId = `language-${lang.id}`
            return (
              <Flex as="li" align="center" key={lang.id}>
                <Checkbox
                  id={languageId}
                  style={STYLES_CHECKBOX}
                  onChange={handleLangCheckboxChange}
                  data-lang-id={lang.id}
                  checked={selected.includes(lang.id)}
                  disabled={isDefaultLang(lang.id)}
                />
                <Box flex={1} paddingLeft={3}>
                  <Text>
                    <label htmlFor={languageId} style={STYLES_CHECKBOX}>
                      {label}
                    </label>
                  </Text>
                </Box>
              </Flex>
            )
          })}
        </Stack>
      </Box>
    </Box>
  )

  return (
    <>
      <Button
        fontSize={1}
        iconRight={ChevronDownIcon}
        mode="bleed"
        ref={setTriggerRef}
        onClick={handleOpen}
        padding={2}
        title={
          allIsSelected
            ? 'Filter language fields'
            : 'Displaying fields only for the selected languages'
        }
        selected={isOpen}
        text={
          <>
            {ACTION_LABEL} ({`${selected.length}/${languages.length}`})
          </>
        }
      />
      <Popover
        content={content}
        open={isOpen}
        placement="bottom"
        ref={setPopoverRef}
        referenceElement={triggerRef}
        tone="default"
        constrainSize
        autoFocus
        portal
      />
    </>
  )
}

export default SelectLanguage
