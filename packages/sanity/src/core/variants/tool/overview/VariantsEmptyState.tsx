import {Flex, Inline, rem, Text} from '@sanity/ui'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {VariantIllustration} from '../resources/VariantIllustration'

interface VariantsEmptyStateProps {
  createVariantButton?: React.ReactNode
}

const VARIANTS_DOCUMENTATION_URL = 'https://www.sanity.io/docs/content-variants'

export const VariantsEmptyState = ({createVariantButton}: VariantsEmptyStateProps) => {
  const {t} = useTranslation(variantsLocaleNamespace)

  return (
    <Flex
      align="center"
      data-testid="variants-empty-state"
      flex={1}
      direction="column"
      gap={3}
      style={{maxWidth: rem(300)}}
      paddingBottom={5}
    >
      <VariantIllustration />
      <Text as="h1" size={1} weight="semibold" data-testid="no-variants-info-text">
        {t('overview.title')}
      </Text>
      <Text size={1} muted style={{textAlign: 'center'}}>
        {t('overview.empty-state.description')}
      </Text>
      <Flex gap={2}>
        {createVariantButton}
        <Button
          as="a"
          href={VARIANTS_DOCUMENTATION_URL}
          target="_blank"
          mode="ghost"
          text={t('overview.action.documentation')}
        />
      </Flex>
    </Flex>
  )
}
