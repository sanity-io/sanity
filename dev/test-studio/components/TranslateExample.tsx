import {Translate, useTranslation} from 'sanity'
import React from 'react'
import {Card, Stack, Text} from '@sanity/ui'
import {InfoFilledIcon} from '@sanity/icons'

export function TranslateExample() {
  const {t} = useTranslation('testStudio')
  return (
    <Card padding={4}>
      <Stack space={4}>
        <Text>{t('use-translation.with-html')}</Text>

        <Text>
          <Translate t={t} i18nKey="use-translation.with-html" />
        </Text>

        <Text>
          <Translate
            t={t}
            i18nKey="translate.example"
            components={{
              Icon: () => <InfoFilledIcon />,
              Red: ({children}) => <span style={{color: 'red'}}>{children}</span>,
              Bold: ({children}) => <b>{children}</b>,
            }}
            values={{
              keyword: 'something',
              duration: '30',
            }}
          />
        </Text>
      </Stack>
    </Card>
  )
}
