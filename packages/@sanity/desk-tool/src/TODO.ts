import React from 'react'

// import resolveDocumentActions from 'part:@sanity/base/document-actions/resolver'
export const resolveDocumentActions = (...args: unknown[]): any[] => []

// import resolveDocumentBadges from 'part:@sanity/base/document-badges/resolver'
export const resolveDocumentBadges = (...args: unknown[]): any[] => []

// import resolveProductionPreviewUrl from 'part:@sanity/transitional/production-preview/resolve-production-url?'
export const resolveProductionPreviewUrl = (...args: unknown[]) => undefined

// import afterEditorComponents from 'all:part:@sanity/desk-tool/after-editor-component'
export const afterEditorComponents: any[] = []

// import documentStore from 'part:@sanity/base/datastore/document'
// import schema from 'part:@sanity/base/schema'

// import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
export const isActionEnabled = (...args: unknown[]) => true

// import filterFieldFn$ from 'part:@sanity/desk-tool/filter-fields-fn?'
export const filterFieldFn$: any = undefined

// import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
export const LanguageFilter: React.ComponentType<any> | undefined = undefined
