// oxlint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Button} from '@sanity/ui'
import {type CSSProperties, useCallback} from 'react'
import {useRouterState} from 'sanity/router'
import {styled} from 'styled-components'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {RhombusOutlinedIcon} from '../../../components/temporary-icons/RhombusOutlined'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {oversizedButtonStyle} from '../../../perspective/styles'
import {ToolLink} from '../../../studio/components/navbar/tools/ToolLink'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {VARIANTS_TOOL_NAME} from '../index'

const OversizedButton = styled(ToolLink)`
  ${oversizedButtonStyle}
`

/**
 * Icon button that opens the variants tool.
 * Filled rhombus when a variant is selected; outlined when viewing the default.
 */
export function VariantsToolLink({
  selectedVariant,
}: {
  selectedVariant?: SystemVariant
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const activeToolName = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )

  return (
    <Tooltip content={t('navbar.tooltip')}>
      <Button
        as={OversizedButton}
        name={VARIANTS_TOOL_NAME}
        data-as="a"
        fontSize={2}
        icon={
          selectedVariant ? (
            <RhombusIcon />
          ) : (
            <RhombusOutlinedIcon
              style={
                {
                  '--card-icon-color': 'var(--card-badge-suggest-icon-color)',
                } as CSSProperties
              }
            />
          )
        }
        mode="bleed"
        padding={2}
        radius="full"
        data-testid="variants-tool-link"
        selected={activeToolName === VARIANTS_TOOL_NAME}
      >
        {null}
      </Button>
    </Tooltip>
  )
}
