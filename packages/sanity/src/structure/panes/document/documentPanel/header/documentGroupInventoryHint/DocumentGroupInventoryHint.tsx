import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {useTelemetry} from '@sanity/telemetry/react'
import {Text} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentType, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {useTranslation} from 'sanity'
import {Flex} from 'ui5'

import {structureLocaleNamespace} from '../../../../../i18n'
import {useDocumentPane} from '../../../useDocumentPane'
import {DocumentGroupInventoryHintPressed} from '../__telemetry__/documentGroupInventoryHint.telemetry'
import {textButton} from './DocumentGroupInventoryHint.css'
import {browserStorageAdapter, hintStatus, suppressHint} from './hintStatus'

export const DocumentGroupInventoryHint: ComponentType = () => {
  const {t} = useTranslation(structureLocaleNamespace)
  const {setIsDocumentGroupInventoryActive} = useDocumentPane()
  const telemetry = useTelemetry()
  const status = useObservable(useMemo(() => hintStatus(browserStorageAdapter), []))

  if (status === 'inactive') {
    return null
  }

  return (
    <TextButton
      onClick={async () => {
        telemetry.log(DocumentGroupInventoryHintPressed)
        setIsDocumentGroupInventoryActive(true)
        await suppressHint(browserStorageAdapter)
      }}
    >
      <Text size={1} weight="medium">
        <Flex
          gap={2}
          alignItems="center"
          flexBasis="auto"
          flexGrow={0}
          flexShrink={0}
          justifyContent="flex-end"
        >
          <InfoOutlineIcon /> {t('document-group-inventory.onboarding-hint')}
        </Flex>
      </Text>
    </TextButton>
  )
}

function TextButton(props: ComponentProps<'button'>) {
  const {className, ...rest} = props

  return <button {...rest} className={clsx(textButton, className)} />
}
