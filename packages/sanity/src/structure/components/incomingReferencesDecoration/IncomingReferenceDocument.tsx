import {Card} from '@sanity/ui'
import {
  addTransitionType,
  type Dispatch,
  type SetStateAction,
  startTransition,
  useState,
  ViewTransition,
} from 'react'
import {type SanityDocument} from 'sanity'
import {useTranslation} from 'sanity/i18n'
import {Text, Flex, Box} from 'ui5'

import {useViewTransitionStyles} from '../../../core/components/viewTransition/viewTransitionStyles'
import {useSchema} from '../../../core/hooks/useSchema'
import {SanityDefaultPreview} from '../../../core/preview/components/SanityDefaultPreview'
import {getReferencePaths} from '../../../core/util/getReferencePaths'
import {studioViewTransitionClass} from '../../../core/viewTransitions/transitionTypes'
import {structureLocaleNamespace} from '../../i18n'
import {fadeIn, pulse} from './IncomingReferenceDocument.css'
import {IncomingReferenceDocumentActions} from './IncomingReferenceDocumentActions'
import {IncomingReferencePreview} from './IncomingReferencePreview'
import {type IncomingReferencesOptions} from './types'

/** The transition type of an action finishing, which eases the pulsing row out to full opacity */
const ACTION_SETTLE_TRANSITION = 'sanity-incoming-reference-settle'

const ROW = studioViewTransitionClass('none')
const ROW_SETTLE = studioViewTransitionClass({
  default: 'none',
  [ACTION_SETTLE_TRANSITION]: 'sanity-vt-settle',
})

const ErrorCard = ({message}: {message: string}) => (
  <Card border radius={2} padding={1} tone="critical">
    <Box paddingY={4} paddingX={3}>
      <Text size={1} as="div" trim={true} tone="critical">
        {message}
      </Text>
    </Box>
  </Card>
)

export const IncomingReferenceDocument = (props: {
  document: SanityDocument
  referenceToId: string
  actions: IncomingReferencesOptions['actions']
}) => {
  const {document, referenceToId, actions} = props
  const referencePaths = getReferencePaths(document, referenceToId)
  const [isExecutingAction, setIsExecutingAction] = useState(false)
  useViewTransitionStyles()
  const schema = useSchema()
  const type = document?._type
  const {t} = useTranslation(structureLocaleNamespace)

  const schemaType = schema.get(type)

  if (!schemaType)
    return <ErrorCard message={t('incoming-references-input.schema-type-not-found', {type})} />

  // The pulse starts on the click. Finishing it is a transition, so the mid-pulse snapshot
  // eases out to full opacity instead of snapping when the infinite animation is removed.
  const finishAction: Dispatch<SetStateAction<boolean>> = (value) => {
    const executing = typeof value === 'function' ? value(isExecutingAction) : value
    if (executing) {
      setIsExecutingAction(true)
      return
    }
    startTransition(() => {
      addTransitionType(ACTION_SETTLE_TRANSITION)
      setIsExecutingAction(false)
    })
  }

  return (
    <Flex alignItems="center" className={fadeIn} gap={1}>
      <ViewTransition default={ROW} update={ROW_SETTLE}>
        <Flex
          alignItems="center"
          className={isExecutingAction ? pulse : undefined}
          flexBasis="0%"
          flexGrow={1}
          gap={1}
        >
          <Box flexBasis="0%" flexGrow={1}>
            {/* In some cases when the document has been recently linked the value we get
          in the listener is not the latest, but a previous value with the document not yet linked, this handles that */}
            {referencePaths.length > 0 ? (
              <IncomingReferencePreview
                type={schemaType}
                value={document}
                path={referencePaths[0]}
              />
            ) : (
              <SanityDefaultPreview icon={schemaType.icon} layout={'default'} isPlaceholder />
            )}
          </Box>

          {actions && actions?.length > 0 && (
            <IncomingReferenceDocumentActions
              document={document}
              actions={actions}
              isExecutingAction={isExecutingAction}
              setIsExecutingAction={finishAction}
            />
          )}
        </Flex>
      </ViewTransition>
    </Flex>
  )
}
