import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {useTelemetry} from '@sanity/telemetry/react'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentType, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {useTranslation} from 'sanity'
import {Text, Flex, Icon} from 'ui5'

import {structureLocaleNamespace} from '../../../../../i18n'
import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../../constants'
import {useDocumentPane} from '../../../useDocumentPane'
import {DocumentGroupInventoryHintPressed} from '../__telemetry__/documentGroupInventoryHint.telemetry'
import {textButton} from './DocumentGroupInventoryHint.css'
import {browserStorageAdapter, hintStatus, suppressHint} from './hintStatus'

export const DocumentGroupInventoryHint: ComponentType = () => {
  const {t} = useTranslation(structureLocaleNamespace)
  const {openInspector} = useDocumentPane()
  const telemetry = useTelemetry()
  const status = useObservable(
    useMemo(() => hintStatus(browserStorageAdapter), []),
    undefined,
  )

  // The status is read from storage asynchronously; a hint the user has already dismissed must
  // not flash while it is unresolved.
  if (status !== 'active') {
    return null
  }

  return (
    <TextButton
      onClick={async () => {
        telemetry.log(DocumentGroupInventoryHintPressed)
        openInspector(DOCUMENT_GROUP_INSPECTOR_NAME)
        await suppressHint(browserStorageAdapter)
      }}
    >
      <Text size={1} weight="medium" as="div" trim={true}>
        <Flex
          gap={2}
          alignItems="center"
          flexBasis="auto"
          flexGrow={0}
          flexShrink={0}
          justifyContent="flex-end"
        >
          <Icon size={1} icon={InfoOutlineIcon} style={{margin: '-0.375rem'}} />{' '}
          {t('document-group-inventory.onboarding-hint')}
        </Flex>
      </Text>
    </TextButton>
  )
}

function TextButton(props: ComponentProps<'button'>) {
  const {className, ...rest} = props

  return <button {...rest} className={clsx(textButton, className)} />
}
