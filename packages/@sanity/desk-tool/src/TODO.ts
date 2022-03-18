import {FormBuilderFilterFieldFn} from '@sanity/base/form'
import {SanityDocument} from '@sanity/types'
import {Observable} from 'rxjs'

// import resolveDocumentBadges from 'part:@sanity/base/document-badges/resolver'
export const resolveDocumentBadges = (..._args: unknown[]): any[] => []

// import resolveProductionPreviewUrl from 'part:@sanity/transitional/production-preview/resolve-production-url?'
export const resolveProductionPreviewUrl = (_value: Partial<SanityDocument>, _rev: string | null) =>
  undefined

// import afterEditorComponents from 'all:part:@sanity/desk-tool/after-editor-component'
export const afterEditorComponents: any[] = []

// import filterFieldFn$ from 'part:@sanity/desk-tool/filter-fields-fn?'
export const filterFieldFn$: Observable<FormBuilderFilterFieldFn> | undefined = undefined
