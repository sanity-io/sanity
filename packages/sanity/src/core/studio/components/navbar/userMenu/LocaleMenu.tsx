import {CheckmarkIcon} from '@sanity/icons'
import {MenuDivider} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useLocale} from '../../../../i18n/hooks/useLocale'
import {MenuItem} from '../../../../../ui-components'

// TODO: re-enable locale selection once schema localization is available
const LOCALE_SELECTION_DISABLED = true

export function LocaleMenu() {
  const {changeLocale, currentLocale, locales} = useLocale()

  if (LOCALE_SELECTION_DISABLED) {
    return null
  }

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
  const selected = selectedLang == localeId

  return (
    <MenuItem
      aria-label={locale.title}
      pressed={selected}
      iconRight={selected && <CheckmarkIcon />}
      onClick={onClick}
      text={locale.title}
    />
  )
}
