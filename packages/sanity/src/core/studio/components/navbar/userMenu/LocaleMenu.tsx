import {MenuDivider} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useLocale} from '../../../../i18n/hooks/useLocale'
import {MenuItem} from '../../../../../ui'

export function LocaleMenu() {
  const {changeLocale, currentLocale, locales} = useLocale()

  if (!locales || locales.length < 2) {
    return null
  }

  return (
    <>
      <MenuDivider />

      {locales.map((item) => (
        <LocaleItem
          key={item.id}
          locale={item}
          changeLocale={changeLocale}
          selectedLocale={currentLocale.id}
        />
      ))}
    </>
  )
}

function LocaleItem(props: {
  locale: {id: string; title: string}
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
      onClick={onClick}
      text={locale.title}
    />
  )
}
