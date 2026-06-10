// eslint-disable-next-line no-restricted-imports -- Button requires props, only supported by @sanity/ui
import {Box, Flex, Button, Text} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type HTMLProps, useMemo} from 'react'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'

import {useTranslation} from '../../../i18n'
import {AnimatedTextWidth} from '../../../perspective/navbar/AnimatedTextWidth'
import {oversizedButtonStyle} from '../../../perspective/styles'
import {variantsLocaleNamespace} from '../../i18n'
import {getVariantId, getVariantTitle} from '../../tool/util'
import {type SystemVariant} from '../../types'
import {VARIANTS_INTENT} from '../index'
import {RhombusIcon} from './PersonalizationIcons'

const OversizedButton = styled(IntentLink)`
  ${oversizedButtonStyle}
`

function VariantDetailLink({variant}: {variant: SystemVariant}) {
  const encodedVariantId = getVariantId(variant._id)

  const VariantLink = useMemo(
    () =>
      forwardRef(function VariantLinkComponent(
        linkProps: HTMLProps<HTMLAnchorElement>,
        ref: ForwardedRef<HTMLAnchorElement>,
      ) {
        return (
          <OversizedButton
            {...linkProps}
            ref={ref}
            intent={VARIANTS_INTENT}
            params={{id: encodedVariantId}}
          />
        )
      }),
    [encodedVariantId],
  )

  return (
    <Button
      as={VariantLink}
      data-as="a"
      data-testid="variants-nav-label-link"
      icon={RhombusIcon}
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
          <Flex align="center" gap={2}>
            <Text size={0}>
              <RhombusIcon />
            </Text>
            <Text data-testid="variants-nav-label" size={1} textOverflow="ellipsis" weight="medium">
              {t('navbar.variant.default')}
            </Text>
          </Flex>
        </Box>
      ) : (
        <VariantDetailLink variant={selectedVariant} />
      )}
    </AnimatedTextWidth>
  )
}
