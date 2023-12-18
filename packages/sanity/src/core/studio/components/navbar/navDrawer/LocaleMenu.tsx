import {CheckmarkIcon} from '@sanity/icons'
import {Card, Stack} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useLocale} from '../../../../i18n/hooks/useLocale'
import {Button} from '../../../../../ui-components'

export function LocaleMenu() {
  const {changeLocale, currentLocale, locales} = useLocale()

  if (!locales || locales.length < 2) {
    return null
  }

  return (
    <Card borderTop flex="none" padding={2} overflow="auto">
      <Stack as="ul" space={1}>
        {locales.map((item) => (
          <LocaleItem
            key={item.id}
            locale={item}
            changeLocale={changeLocale}
            selectedLocale={currentLocale.id}
          />
        ))}
      </Stack>
    </Card>
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
    <Button
      aria-label={locale.title}
      iconRight={selected && <CheckmarkIcon />}
      justify="flex-start"
      mode="bleed"
      onClick={onClick}
      selected={selected}
      size="large"
      text={locale.title}
    />
  )
}
