import {ResetIcon} from '@sanity/icons/Reset'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type CrossDatasetReferenceValue} from '@sanity/types'
import {Card} from '@sanity/ui'
import {useMemo} from 'react'
import {Text, Flex, VStack, Icon, Link, Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'

type Props = {
  value?: CrossDatasetReferenceValue
  onClearValue?: () => void
}

function DocumentationLink({children}: {children?: React.ReactNode}) {
  return (
    <Link
      href="https://www.sanity.io/docs/cross-dataset-references"
      openInNewTab
      underlined={false}
      style={{color: 'var(--card-link-color)'}}
    >
      {children}
    </Link>
  )
}

export function DisabledFeatureWarning({value, onClearValue}: Props) {
  const hasRef = useMemo(() => Boolean(value?._ref), [value?._ref])
  const {t} = useTranslation()

  const description = (
    <Translate
      t={t}
      i18nKey="inputs.reference.cross-dataset.feature-disabled-description"
      components={{DocumentationLink}}
    />
  )

  return (
    <Card
      tone="caution"
      padding={4}
      border
      radius={2}
      data-testid="alert-cross-dataset-reference-feature-disabled"
    >
      <Flex gap={4} marginBottom={hasRef ? 4 : undefined}>
        <Box>
          <Icon
            size={1}
            muted
            icon={WarningOutlineIcon}
            tone="caution"
            style={{
              margin: '-0.3125rem',
              marginLeft: '-0.375rem',
            }}
          />
        </Box>
        <VStack gap={3}>
          <Text as="h2" size={1} weight="medium" trim={true} tone="caution">
            {t('inputs.reference.cross-dataset.feature-unavailable-title')}
          </Text>
          {hasRef && (
            <VStack gap={3}>
              <Text as="p" size={1} trim={true} tone="caution">
                {description}
              </Text>
              <Text as="p" size={1} trim={true} tone="caution">
                {t('inputs.reference.cross-dataset.feature-disabled-actions')}
              </Text>
            </VStack>
          )}
          {!hasRef && (
            <Text as="p" size={1} trim={true} tone="caution">
              {description}
            </Text>
          )}
        </VStack>
      </Flex>
      {onClearValue && hasRef && (
        <Button
          icon={ResetIcon}
          mode="ghost"
          onClick={onClearValue}
          text={t('inputs.reference.action.clear')}
          width="fill"
        />
      )}
    </Card>
  )
}
