import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {useTelemetry} from '@sanity/telemetry/react'
import {Flex, Text} from '@sanity/ui'
import {useMemo, type ComponentType} from 'react'
import {useObservable} from 'react-rx'
import {useTranslation} from 'sanity'
import {styled, css} from 'styled-components'

import {structureLocaleNamespace} from '../../../../../i18n'
import {useDocumentPane} from '../../../useDocumentPane'
import {DocumentGroupInventoryHintPressed} from '../__telemetry__/documentGroupInventoryHint.telemetry'
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
        <Flex gap={2} align="center" flex="none" justify="flex-end">
          <InfoOutlineIcon /> {t('document-group-inventory.onboarding-hint')}
        </Flex>
      </Text>
    </TextButton>
  )
}

const TextButton = styled.button(({theme}) => {
  return css`
    display: inline-block;
    vertical-align: middle;
    appearance: none;
    border: 0;
    margin: 0;
    padding: 0;
    outline: none;
    all: unset;
    flex: none;
    white-space: nowrap;
    color: var(--card-badge-suggest-fg-color);
    cursor: pointer;

    * {
      color: inherit;
    }

    svg[data-sanity-icon] {
      color: currentColor;
    }
  `
})
