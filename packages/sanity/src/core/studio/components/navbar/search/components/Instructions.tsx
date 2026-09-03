import {ControlsIcon} from '@sanity/icons/Controls'
import {Inline, Text} from '@sanity/ui'
import {Flex} from 'ui5'

import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {Translate} from '../../../../../i18n/Translate'

function PaddedControlsIcon() {
  return <ControlsIcon style={{padding: '0 0.25rem'}} />
}

export function Instructions() {
  const {t} = useTranslation()

  return (
    <Flex alignItems="center" flexDirection="column" gap={4} paddingX={4} paddingY={5}>
      <Inline gap={3}>
        <Text muted>
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
