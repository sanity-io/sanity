import React from 'react'
import {noop} from 'lodash'
import {InitialValueProvider, InitialValueProviderProps} from './initialValue'
import {
  DocumentIdAndTypeProvider,
  DocumentIdAndTypeProviderProps,
} from './DocumentIdAndTypeProvider'
import {TimelineProvider, TimelineProviderProps} from './timeline'
import {FormStateProvider, FormStateProviderProps} from './formState'
import {
  ReferenceInputOptionsProvider,
  ReferenceInputOptionsProviderProps,
} from './referenceInputOptions'

/** @internal */
export interface DocumentProviderProps
  extends DocumentIdAndTypeProviderProps,
    TimelineProviderProps,
    InitialValueProviderProps,
    FormStateProviderProps,
    ReferenceInputOptionsProviderProps {}

/** @internal */
export function DocumentProvider({
  documentId,
  documentType,
  templateName,
  templateParams,
  timelineRange = {},
  onTimelineRangeChange = noop,
  initialFocusPath,
  isHistoryInspectorOpen,
  fallback,
  children,
  EditReferenceLinkComponent,
  onEditReference,
  activePath,
}: DocumentProviderProps) {
  return (
    <DocumentIdAndTypeProvider
      documentId={documentId}
      documentType={documentType}
      templateName={templateName}
      fallback={fallback}
    >
      <TimelineProvider timelineRange={timelineRange} onTimelineRangeChange={onTimelineRangeChange}>
        <InitialValueProvider
          templateName={templateName}
          templateParams={templateParams}
          fallback={fallback}
        >
          <ReferenceInputOptionsProvider
            EditReferenceLinkComponent={EditReferenceLinkComponent}
            onEditReference={onEditReference}
            activePath={activePath}
            fallback={fallback}
          >
            <FormStateProvider
              initialFocusPath={initialFocusPath}
              isHistoryInspectorOpen={isHistoryInspectorOpen}
            >
              {children}
            </FormStateProvider>
          </ReferenceInputOptionsProvider>
        </InitialValueProvider>
      </TimelineProvider>
    </DocumentIdAndTypeProvider>
  )
}
