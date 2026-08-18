// oxlint-disable-next-line no-restricted-imports -- Button requires props, only supported by @sanity/ui
import {Button, Text} from '@sanity/ui'
import {type HTMLProps, useMemo, type RefAttributes} from 'react'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'
import {Box} from 'ui5'

import {RhombusIcon} from '../../../components/documentStatusIndicator/temporary-icons/Rhombus'
import {RhombusOutlinedIcon} from '../../../components/documentStatusIndicator/temporary-icons/RhombusOutlined'
import {TextWithTone} from '../../../components/textWithTone/TextWithTone'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {AnimatedTextWidth} from '../../../perspective/navbar/AnimatedTextWidth'
import {oversizedButtonStyle} from '../../../perspective/styles'
import {variantsLocaleNamespace} from '../../i18n'
import {getVariantId, getVariantTitle} from '../../tool/util'
import {type SystemVariant} from '../../types'
import {VARIANTS_INTENT} from '../index'

const OversizedButton = styled(IntentLink)`
  ${oversizedButtonStyle}
`

function VariantDetailLink({variant}: {variant: SystemVariant}) {
  const encodedVariantId = getVariantId(variant._id)

  const VariantLink = useMemo(
    () =>
      function VariantLinkComponent(
        linkProps: HTMLProps<HTMLAnchorElement> & RefAttributes<HTMLAnchorElement>,
      ) {
        const {ref, ...rest} = linkProps
        return (
          <OversizedButton
            {...rest}
            ref={ref}
            intent={VARIANTS_INTENT}
            params={{id: encodedVariantId}}
          />
        )
      },
    [encodedVariantId],
  )

  return (
    <Button
      as={VariantLink}
      data-as="a"
      data-testid="variants-nav-label-link"
      mode="bleed"
      padding={2}
      radius="full"
      style={{maxWidth: '180px'}}
      text={getVariantTitle(variant)}
    />
  )
}

/**
 * @internal
 */
export function CurrentVariantLabel({
  selectedVariant,
}: {
  selectedVariant?: SystemVariant
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)

  const animationKey = selectedVariant?._id ?? 'default'

  return (
    <AnimatedTextWidth text={animationKey}>
      {!selectedVariant ? (
        <Box padding={2} style={{userSelect: 'none', overflow: 'hidden'}}>
          <Text data-testid="variants-nav-label" size={1} textOverflow="ellipsis" weight="medium">
            {t('navbar.variant.default')}
          </Text>
        </Box>
      ) : (
        <VariantDetailLink variant={selectedVariant} />
      )}
    </AnimatedTextWidth>
  )
}
