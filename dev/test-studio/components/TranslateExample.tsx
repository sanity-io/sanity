import {InfoFilledIcon} from '@sanity/icons/InfoFilled'
import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Translate, useTranslation} from 'sanity'
import {Icon, Text, VStack} from 'ui5'

export function TranslateExample() {
  const {t} = useTranslation('testStudio')
  return (
    <Card padding={4}>
      <VStack gap={4}>
        <Text as="div" trim={true}>
          {t('use-translation.with-html')}
        </Text>
        <Text as="div" trim={true}>
          {t('use-translation.interpolation-example', {
            spaces: 'spaces',
            doesNot: 'does not have spaces',
          })}
        </Text>
        <Text as="div" trim={true}>
          {t('translate.with-formatter', {
            countries: ['Norway', 'Denmark', 'Sweden'],
          })}
        </Text>
        <Text as="div" trim={true}>
          <Translate t={t} i18nKey="use-translation.with-html" />
        </Text>
        <Text as="div" trim={true}>
          <Translate
            t={t}
            i18nKey="translate.example"
            components={{Icon: InfoFilledIconComponent, Red, Bold}}
            values={{
              keyword: 'something',
              duration: '30',
            }}
          />
        </Text>
        <Text as="div" trim={true}>
          <Translate
            t={t}
            i18nKey="translate.with-xml-in-value"
            values={{
              value: '<svg>hello</svg>',
            }}
          />
        </Text>

        <Text as="div" trim={true}>
          <Translate
            t={t}
            i18nKey="use-translation.interpolation-example"
            values={{
              spaces: 'spaces',
              doesNot: 'does not have spaces',
            }}
          />
        </Text>

        <Text weight="bold" as="div" trim={true}>
          Broken translations (should fall back gracefully, not crash):
        </Text>

        <Text as="div" trim={true}>
          Missing self-closing:{' '}
          <Translate t={t} i18nKey="translate.missing-self-closing" components={{}} />
        </Text>
        <Text as="div" trim={true}>
          Missing wrapping: <Translate t={t} i18nKey="translate.missing-wrapping" components={{}} />
        </Text>
        <Text as="div" trim={true}>
          Mismatched component (issue #12617):{' '}
          <Translate
            t={t}
            i18nKey="translate.mismatched-component"
            components={{VersionBadge}}
            values={{title: 'My Release'}}
          />
        </Text>
      </VStack>
    </Card>
  )
}

function VersionBadge({children}: {children?: ReactNode}) {
  return <span style={{fontWeight: 'bold'}}>{children}</span>
}
function Red({children}: {children?: ReactNode}) {
  return <span style={{color: 'red'}}>{children}</span>
}
function Bold({children}: {children?: ReactNode}) {
  return <b>{children}</b>
}
function InfoFilledIconComponent() {
  return <Icon size={1} icon={InfoFilledIcon} style={{margin: '-0.375rem'}} />
}
