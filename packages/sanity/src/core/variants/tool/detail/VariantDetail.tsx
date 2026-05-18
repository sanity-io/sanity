import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components/button/Button'
import {LoadingBlock} from '../../../components'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {getVariantDescription, getVariantTitle} from '../util'

export function VariantDetail() {
  const router = useRouter()
  const {t} = useTranslation(variantsLocaleNamespace)
  const variantIdRaw =
    typeof router.state.variantId === 'string' ? router.state.variantId : undefined
  const variantId = decodeURIComponent(variantIdRaw || '')
  const {data: variants, loading} = useAllVariants()

  const variant = useMemo(
    () => variants.find((candidate) => candidate._id === variantId),
    [variantId, variants],
  )

  if (loading) {
    return <LoadingBlock fill title={t('detail.loading')} />
  }

  if (!variant) {
    return (
      <Flex direction="column" flex={1} height="fill">
        <Card borderBottom flex="none" padding={3}>
          <Button mode="bleed" onClick={() => router.navigate({})} text={t('detail.back')} />
        </Card>
        <Box padding={4}>
          <Card border padding={4} radius={3}>
            <Stack space={3}>
              <Text size={2} weight="semibold">
                {t('detail.not-found.title')}
              </Text>
              <Text muted size={1}>
                {t('detail.not-found.description')}
              </Text>
            </Stack>
          </Card>
        </Box>
      </Flex>
    )
  }

  const description = getVariantDescription(variant)

  return (
    <Flex direction="column" flex={1} height="fill">
      <Card borderBottom flex="none" padding={3}>
        <Button mode="bleed" onClick={() => router.navigate({})} text={t('detail.back')} />
      </Card>
      <Box padding={4}>
        <Card border padding={4} radius={3}>
          <Stack space={4}>
            <Stack space={3}>
              <Text as="h1" size={4} weight="bold">
                {getVariantTitle(variant)}
              </Text>
              <Text muted size={1}>
                {description || t('detail.no-description')}
              </Text>
            </Stack>
            <Text muted size={1}>
              {t('detail.placeholder')}
            </Text>
          </Stack>
        </Card>
      </Box>
    </Flex>
  )
}
