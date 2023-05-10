import React, {lazy, Suspense} from 'react'
import {Card} from '@sanity/ui'
import {LanguageLoader, LanguageBundle, TranslationLoader, useTranslation} from 'sanity'

const Child = lazy(
  () =>
    new Promise<any>((resolve) => {
      setTimeout(() => {
        resolve(import('./I18nLazyChild'))
      }, 2000)
    }),
)

const namespace = 'i18nTool'
const loader: LanguageLoader = async (lang) => {
  return new Promise<LanguageBundle>((resolve) => {
    resolve({
      namespace: namespace,
      resources: {
        loadingChild: `${lang}: Loading lazy child...`,
        childText: `${lang}: Child`,
      },
    })
  })
}

export default function I18nLazyParent() {
  const {t} = useTranslation(namespace)
  return (
    <TranslationLoader languageLoader={loader}>
      <Card padding={2}>
        <Suspense fallback={<div>{t('loadingChild')}</div>}>
          <Child />
        </Suspense>
      </Card>
    </TranslationLoader>
  )
}
