import React from 'react'
import {useTranslation} from 'sanity'

export default function I18nLazyChild() {
  const {t} = useTranslation('i18nTool')
  return <>{t('childText')}</>
}
