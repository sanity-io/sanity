import {Box, Card, Flex, Text} from '@sanity/ui'
import {lazy, type ReactNode, Suspense} from 'react'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type PortableTextInputProps} from '../../types'

const LazyPortableTextInput = lazy(() =>
  import('./PortableTextInput').then((mod) => ({
    default: mod.PortableTextInput,
  })),
)

function PortableTextInputPlaceholder() {
  const {t} = useTranslation()

  return (
    <Box>
      <Card border radius={2} style={{minHeight: '5em', display: 'flex'}}>
        <Flex align="center" justify="center" flex={1} padding={4}>
          <Text size={1} muted>
            {t('inputs.portable-text.loading')}
          </Text>
        </Flex>
      </Card>
    </Box>
  )
}

export function PortableTextInput(props: PortableTextInputProps): ReactNode {
  return (
    <Suspense fallback={<PortableTextInputPlaceholder />}>
      <LazyPortableTextInput {...props} />
    </Suspense>
  )
}

export type {PortableTextMemberItem} from './PortableTextInput'
