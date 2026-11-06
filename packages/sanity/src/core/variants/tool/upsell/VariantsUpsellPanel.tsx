import {rem} from '@sanity/ui'
import {Text, Flex} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../../i18n'
import {VariantIllustration} from '../resources/VariantIllustration'

/**
 * Placeholder upsell panel for the Variants tool. To be replaced by `UpsellPanel` once the content
 * variants upsell content is published.
 *
 * @internal
 */
export function VariantsUpsellPanel(): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)

  return (
    <Flex
      alignItems="center"
      data-testid="variants-upsell-panel"
      flexDirection="column"
      gap={3}
      style={{maxWidth: rem(300)}}
      paddingBottom={5}
    >
      <VariantIllustration />
      <Text as="h2" size={1} weight="semibold" align="center" trim={true}>
        {t('upsell.panel.title')}
      </Text>
      <Text size={1} muted align="center" as="div" trim={true}>
        {t('upsell.panel.description')}
      </Text>
    </Flex>
  )
}
