import {type SanityDocument} from '@sanity/client'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components/button/Button'
import {LoadingBlock} from '../../../components'
import {useTranslation} from '../../../i18n'
import {EditVariantDialog} from '../../components/dialog/EditVariantDialog'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {
  decodeVariantIdFromRoute,
  getVariantConditionsText,
  getVariantDescription,
  getVariantTitle,
} from '../util'
import {VariantDetailFooter} from './VariantDetailFooter'
import {VariantDocumentsTable} from './VariantDocumentsTable'

const EMPTY_VARIANT_DOCUMENTS: SanityDocument[] = []

export function VariantDetail() {
  const router = useRouter()
  const {t} = useTranslation(variantsLocaleNamespace)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const variantIdRaw =
    typeof router.state.variantId === 'string' ? router.state.variantId : undefined
  const variantId = decodeVariantIdFromRoute(variantIdRaw)
  const {byId, loading} = useAllVariants()

  const variant = variantId ? byId.get(variantId) : undefined

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
  const conditionsText = getVariantConditionsText(variant.conditions)

  return (
    <Flex direction="column" flex={1} height="fill" overflow="hidden">
      <Card borderBottom flex="none" padding={3}>
        <Button mode="bleed" onClick={() => router.navigate({})} text={t('detail.back')} />
      </Card>
      <Flex direction="column" flex={1} height="fill" overflow="hidden" style={{minHeight: 0}}>
        <Container flex="none" width={3}>
          <Flex direction="column" paddingX={3}>
            <Card paddingY={5}>
              <Flex align="flex-start" gap={4} justify="space-between">
                <Stack space={3}>
                  <Text as="h1" size={4} weight="bold">
                    {getVariantTitle(variant)}
                  </Text>
                  <Text muted size={1}>
                    {description || t('detail.no-description')}
                  </Text>
                </Stack>
                <Button
                  onClick={() => setEditDialogOpen(true)}
                  text={t('detail.action.edit-variant')}
                />
              </Flex>

              <Box paddingTop={4}>
                <Stack space={2}>
                  <Text size={1} weight="medium">
                    {t('dialog.create.conditions.title')}
                  </Text>
                  <Text muted size={1}>
                    {conditionsText || t('overview.table.no-conditions')}
                  </Text>
                </Stack>
              </Box>
            </Card>
          </Flex>
        </Container>
        <Flex direction="column" flex={1} overflow="hidden" style={{minHeight: 0}}>
          <VariantDocumentsTable documents={EMPTY_VARIANT_DOCUMENTS} />
        </Flex>
      </Flex>
      <VariantDetailFooter variant={variant} />
      {editDialogOpen && (
        <EditVariantDialog
          onCancel={() => setEditDialogOpen(false)}
          onSubmit={() => setEditDialogOpen(false)}
          variant={variant}
        />
      )}
    </Flex>
  )
}
