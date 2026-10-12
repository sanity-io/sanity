import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {useTelemetry} from '@sanity/telemetry/react'
import {Text} from '@sanity/ui'
import {type ComponentType, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {useTranslation} from 'sanity'
import {styled, css} from 'styled-components'
import {Flex} from 'ui5'

import {structureLocaleNamespace} from '../../../../../i18n'
import {useDocumentGroupInventoryTarget} from '../../../useDocumentGroupInventoryTarget'
import {useDocumentPane} from '../../../useDocumentPane'
import {DocumentGroupInventoryHintPressed} from '../__telemetry__/documentGroupInventoryHint.telemetry'
import {browserStorageAdapter, hintStatus, type HintStatus, suppressHint} from './hintStatus'

/**
 * Onboarding hint pointing at the "Manage versions" action in the pane footer. Pressing it
 * opens the document group inventory, so it is only rendered while that action is mounted
 * (see {@link useDocumentGroupInventoryTarget}) — otherwise pressing it would do nothing.
 */
export const DocumentGroupInventoryHint: ComponentType = () => {
  const {t} = useTranslation(structureLocaleNamespace)
  const {setIsDocumentGroupInventoryActive} = useDocumentPane()
  const {isAvailable} = useDocumentGroupInventoryTarget()
  const telemetry = useTelemetry()
  const status = useObservable(
    // Reading the status counts the session towards the hint's budget, so only read it once
    // there is an inventory to open; a hidden hint must not use up its sessions.
    useMemo(
      (): Observable<HintStatus | undefined> =>
        isAvailable ? hintStatus(browserStorageAdapter) : of(undefined),
      [isAvailable],
    ),
    undefined,
  )

  // The status is read from storage asynchronously; a hint the user has already dismissed must
  // not flash while it is unresolved.
  if (status !== 'active' || !isAvailable) {
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
