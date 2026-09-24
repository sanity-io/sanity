import {useTelemetry} from '@sanity/telemetry/react'
import {useActorRef} from '@xstate/react'
import {type ReactNode, useMemo, useRef, useState} from 'react'
import {SearchContext} from 'sanity/_singletons'
import {fromObservable, type InspectionEvent} from 'xstate'

import {type CommandListHandle} from '../../../../../../components/commandList/types'
import {useSchema} from '../../../../../../hooks/useSchema'
import {useShallowUnique} from '../../../../../../util/useShallowUnique'
import {useSource} from '../../../../../source'
import {GlobalSearchLatencyMeasured} from '../../__telemetry__/search.telemetry'
import {createFieldDefinitionDictionary, createFieldDefinitions} from '../../definitions/fields'
import {createFilterDefinitionDictionary} from '../../definitions/filters'
import {createOperatorDefinitionDictionary} from '../../definitions/operators'
import {useGlobalSearchFunction} from '../../hooks/useGlobalSearchFunction'
import {debugWithName, isDebugMode} from '../../utils/debug'
import {globalSearchMachine, type GlobalSearchMachineInput} from './globalSearchMachine'
import {type SearchContextValue} from './SearchContext'

interface SearchProviderProps {
  children?: ReactNode
  fullscreen?: boolean
  /**
   * list of perspective ids
   * if provided, then it means that the search is being done using a specific list of perspectives
   */

  /**
   * list of document ids that should be be disabled in the search
   * if they are found to exist in the search results
   * if provided, then ids should be checked against this list
   */
  disabledDocumentIds?: string[]
  /**
   * If true, the search action (such as adding a document to a release list, for example) should be allowed to disable under the right conditions
   */
  canDisableAction?: boolean
}

const debug = debugWithName('machine')

function logSearchEvent(inspectionEvent: InspectionEvent) {
  if (
    inspectionEvent.type === '@xstate.event' &&
    !inspectionEvent.event.type.startsWith('xstate.')
  ) {
    debug('🔍', inspectionEvent.event)
  }
}

/**
 * @internal
 */
export function SearchProvider({
  children,
  fullscreen,
  disabledDocumentIds,
  canDisableAction,
}: SearchProviderProps) {
  const schema = useSchema()
  const {
    search: {operators, filters, strategy},
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  } = useSource()
  const telemetry = useTelemetry()
  const search = useGlobalSearchFunction(schema)

  // Read once when the actor is created
  const [input] = useState((): GlobalSearchMachineInput => ({
    schema,
    definitions: {
      fields: createFieldDefinitionDictionary(createFieldDefinitions(schema, filters)),
      filters: createFilterDefinitionDictionary(filters),
      operators: createOperatorDefinitionDictionary(operators),
    },
    strategy,
    debug: isDebugMode(),
  }))

  const searchActorRef = useActorRef(
    globalSearchMachine.provide({
      actors: {
        search: fromObservable(({input: {request}}) => search(request.terms, request.options)),
      },
      actions: {
        'log search latency': (_, latency) => {
          if (latency) {
            telemetry.log(GlobalSearchLatencyMeasured, latency)
          }
        },
      },
    }),
    {input, inspect: logSearchEvent},
  )

  const searchCommandListRef = useRef<CommandListHandle | null>(null)
  const uniqueDisabledDocumentIds = useShallowUnique(disabledDocumentIds)

  const value = useMemo(
    (): SearchContextValue => ({
      searchActorRef,
      searchCommandListRef,
      onClose: null,
      fullscreen,
      disabledDocumentIds: uniqueDisabledDocumentIds,
      canDisableAction,
    }),
    [canDisableAction, fullscreen, searchActorRef, uniqueDisabledDocumentIds],
  )

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}
