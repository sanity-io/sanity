import {ResetIcon, WarningOutlineIcon} from '@sanity/icons'
import {Card, Flex, Box, Text, Stack, Button} from '@sanity/ui'
import type {CrossDatasetReferenceValue} from '@sanity/types'
import React, {useMemo} from 'react'
import styled from 'styled-components'
import {Translate, useTranslation} from '../../../i18n'

type Props = {
  value?: CrossDatasetReferenceValue
  onClearValue?: () => void
}

const ButtonWrapper = styled(Button)`
  width: 100%;
`

export function DisabledFeatureWarning({value, onClearValue}: Props) {
  const hasRef = useMemo(() => Boolean(value?._ref), [value?._ref])
  const {t} = useTranslation()

  const description = (
    <Translate
      t={t}
      i18nKey="inputs.reference.cross-dataset.feature-disabled-description"
      components={{
        DocumentationLink: ({children}) => (
          <a
            href="https://www.sanity.io/docs/cross-dataset-references"
            target="_blank"
            rel="noreferrer"
          >
            {children}
          </a>
        ),
      }}
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
          <Text size={1}>
            <WarningOutlineIcon />
          </Text>
        </Box>
        <Stack space={3}>
          <Text as="h2" size={1} weight="semibold">
            {t('inputs.reference.cross-dataset.feature-unavailable-title')}
          </Text>
          {hasRef && (
            <Stack space={3}>
              <Text as="p" size={1}>
                {description}
              </Text>
              <Text as="p" size={1}>
                {t('inputs.reference.cross-dataset.feature-disabled-actions')}
              </Text>
            </Stack>
          )}
          {!hasRef && (
            <Text as="p" size={1}>
              {description}
            </Text>
          )}
        </Stack>
      </Flex>
      {onClearValue && hasRef && (
        <ButtonWrapper
          icon={ResetIcon}
          text={t('inputs.reference.action.clear')}
          onClick={onClearValue}
          mode="ghost"
        />
      )}
    </Card>
  )
}
