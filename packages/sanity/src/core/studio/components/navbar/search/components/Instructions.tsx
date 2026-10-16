import {ControlsIcon} from '@sanity/icons/Controls'
import {Inline} from '@sanity/ui'
import {Text, Flex, Icon} from 'ui5'

import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {Translate} from '../../../../../i18n/Translate'

function PaddedControlsIcon() {
  return <Icon muted icon={ControlsIcon} style={{padding: '0 0.25rem', margin: '-0.4375rem'}} />
}

export function Instructions() {
  const {t} = useTranslation()

  return (
    <Flex alignItems="center" flexDirection="column" gap={4} paddingX={4} paddingY={5}>
      <Inline gap={3}>
        <Text muted as="div" trim={true}>
          <Translate
            t={t}
            i18nKey="search.instructions"
            components={{ControlsIcon: PaddedControlsIcon}}
          />
        </Text>
      </Inline>
    </Flex>
  )
}
