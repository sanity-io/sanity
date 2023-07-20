import {Box, Label, MenuDivider, MenuItem} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useLocale, type LocaleDefinition} from '../../../../i18n'

export function LocaleMenu() {
  const {changeLocale, currentLocale, locales} = useLocale()
  if (!locales || locales.length < 2) {
    return null
  }

  return (
    <>
      <MenuDivider />

      <Box padding={2}>
        <Label size={1} muted>
          Language
        </Label>
      </Box>

      {locales.map((item) => (
        <LocaleItem
          key={item.id}
          locale={item}
          changeLocale={changeLocale}
          selectedLocale={currentLocale}
        />
      ))}
    </>
  )
}

function LocaleItem(props: {
  locale: LocaleDefinition
  changeLocale: (lang: string) => void
  selectedLocale: string
}) {
  const {locale, changeLocale, selectedLocale: selectedLang} = props
  const localeId = locale.id
  const onClick = useCallback(() => changeLocale(localeId), [localeId, changeLocale])
  return (
    <MenuItem
      aria-label={locale.title}
      pressed={selectedLang == localeId}
      icon={
        locale.icon ?? (
          <>
            <code>{localeId}</code>
          </>
        )
      }
      onClick={onClick}
      text={locale.title}
    />
  )
}
