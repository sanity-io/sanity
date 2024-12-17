import {InfoFilledIcon} from '@sanity/icons'
import {Card, Stack, Text} from '@sanity/ui'
import {forwardRef} from 'react'
import {Translate, useTranslation} from 'sanity'

export const TranslateExample = forwardRef(function TranslateExample() {
  const {t} = useTranslation('testStudio')
  return (
    <Card padding={4}>
      <Stack space={4}>
        <Text>{t('use-translation.with-html')}</Text>
        <Text>
          {t('use-translation.interpolation-example', {
            spaces: 'spaces',
            doesNot: 'does not have spaces',
          })}
        </Text>
        <Text>
          {t('translate.with-formatter', {
            countries: ['Norway', 'Denmark', 'Sweden'],
          })}
        </Text>
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
        <Text>
          <Translate
            t={t}
            i18nKey="translate.with-xml-in-value"
            values={{
              value: '<svg>hello</svg>',
            }}
          />
        </Text>

        <Text>
          <Translate
            t={t}
            i18nKey="use-translation.interpolation-example"
            values={{
              spaces: 'spaces',
              doesNot: 'does not have spaces',
            }}
          />
        </Text>
      </Stack>
    </Card>
  )
})
