import {ResetIcon, WarningOutlineIcon} from '@sanity/icons'
import {Card, Flex, Box, Text, Stack} from '@sanity/ui'
import React, {useMemo} from 'react'
import {CrossDatasetReferenceValue} from '@sanity/types'
import {Button} from '../../../../ui'

type Props = {
  value?: CrossDatasetReferenceValue
  onClearValue?: () => void
}

export function DisabledFeatureWarning({value, onClearValue}: Props) {
  const hasRef = useMemo(() => Boolean(value?._ref), [value?._ref])

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
          <Text as="h2" size={1} weight="medium">
            Unavailable feature: Cross dataset reference
          </Text>
          {hasRef && (
            <Stack space={3}>
              <Text as="p" size={1}>
                This feature has been disabled. Read how to enable it in{' '}
                <a
                  href="https://www.sanity.io/docs/cross-dataset-references"
                  target="_blank"
                  rel="noreferrer"
                >
                  documentation
                </a>
              </Text>
              <Text as="p" size={1}>
                You can still clear this field&apos;s existing reference, but that cannot be revoked
                as long as the feature is disabled.
              </Text>
            </Stack>
          )}
          {!hasRef && (
            <Text as="p" size={1}>
              Read how to enable it in{' '}
              <a
                href="https://www.sanity.io/docs/cross-dataset-references"
                target="_blank"
                rel="noreferrer"
              >
                documentation
              </a>
            </Text>
          )}
        </Stack>
      </Flex>
      {onClearValue && hasRef && (
        <Button
          width="fill"
          icon={ResetIcon}
          text="Reset value"
          onClick={onClearValue}
          mode="ghost"
        />
      )}
    </Card>
  )
}
