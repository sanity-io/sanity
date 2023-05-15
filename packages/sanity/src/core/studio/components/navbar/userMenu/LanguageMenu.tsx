import {Box, Label, MenuDivider, MenuItem} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useSource} from '../../../source'
import {LanguageDefinition} from '../../../../config'
import {useLanguage} from '../../../../i18n/components/LanguageContext'
import {useTranslation} from 'react-i18next'

export function LanguageMenu() {
  const {changeLanguage} = useLanguage()
  const {
    i18n: {language},
  } = useTranslation()
  const {i18n} = useSource()
  const languages = i18n.languages
  if (!languages || languages.length < 2) {
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

      {languages.map((lang) => (
        <LanguageItem
          key={lang.id}
          lang={lang}
          changeLanguage={changeLanguage}
          selectedLang={language}
        />
      ))}
    </>
  )
}

function LanguageItem(props: {
  lang: LanguageDefinition
  changeLanguage: (lang: string) => void
  selectedLang: string
}) {
  const {lang, changeLanguage, selectedLang} = props
  const onClick = useCallback(() => changeLanguage(lang.id), [lang, changeLanguage])
  return (
    <MenuItem
      aria-label={lang.title}
      pressed={selectedLang == lang.id}
      icon={
        lang.icon ?? (
          <>
            <code>{lang.id}</code>
          </>
        )
      }
      onClick={onClick}
      text={lang.title}
    />
  )
}
