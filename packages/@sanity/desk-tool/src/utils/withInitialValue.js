/* eslint-disable max-nested-callbacks */
import React from 'react'
import {streamingComponent} from 'react-props-stream'
import {merge, from, of} from 'rxjs'
import {map, switchMap, scan, filter, distinctUntilChanged, catchError} from 'rxjs/operators'
import schema from 'part:@sanity/base/schema'
import {observePaths} from 'part:@sanity/base/preview'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import ErrorPane from '../pane/ErrorPane'
import LoadingPane from '../pane/LoadingPane'
import BrokenReferences from '../components/BrokenReferences'
import {
  templateExists,
  getTemplateById,
  getTemplatesBySchemaType,
  resolveInitialValue
} from '@sanity/base/initial-value-templates'

const withInitialValue = Pane =>
  streamingComponent(props$ =>
    props$.pipe(
      switchMap(props => {
        const {options} = props
        // See if the document ID has a draft or a published document
        return merge(
          observePaths(getDraftId(options.id), ['_type']).pipe(map(draft => ({draft}))),
          observePaths(getPublishedId(options.id), ['_type']).pipe(map(published => ({published})))
        ).pipe(
          scan((prev, res) => ({...prev, ...res}), {}),
          // Wait until we know the state of both draft and published
          filter(res => 'draft' in res && 'published' in res),
          map(res => res.draft || res.published),
          // Only update if we didn't previously have a document but we now do
          distinctUntilChanged((prev, next) => Boolean(prev) !== Boolean(next)),
          switchMap(document => {
            const {templateName, parameters} = getInitialValueProps(document, props)
            const shouldResolve = Boolean(templateName)
            const documentType = options.type || (document && document._type)

            // If we were not passed a schema type, use the resolved value if available
            const paneOptions = options.type ? options : {...options, type: documentType}

            if (!shouldResolve) {
              // Wrap in broken references component to prevent "reload"
              // when going from missing document to a document that exists
              return of(
                <BrokenReferences document={{}} type={documentType} schema={schema}>
                  <Pane {...props} options={paneOptions} />
                </BrokenReferences>
              )
            }

            return merge(
              of({isResolving: true}),
              resolveInitialValueWithParameters(templateName, parameters).pipe(
                catchError(resolveError => {
                  /* eslint-disable no-console */
                  console.group('Failed to resolve initial value')
                  console.error(resolveError)
                  console.error('Template ID: %s', templateName)
                  console.error('Parameters: %o', parameters || {})
                  console.groupEnd()
                  /* eslint-enable no-console */

                  return of({resolveError})
                })
              )
            ).pipe(
              switchMap(({isResolving, initialValue, resolveError}) => {
                if (resolveError) {
                  return of(
                    <ErrorPane>
                      <h2>Failed to resolve initial value</h2>
                      <p>Check developer console for details</p>
                    </ErrorPane>
                  )
                }

                const title =
                  documentType && `New ${schema.get(documentType).title || documentType}`

                return of(
                  isResolving ? (
                    <LoadingPane {...props} title={title} message="Resolving initial value…" />
                  ) : (
                    <BrokenReferences document={initialValue} type={documentType} schema={schema}>
                      <Pane {...props} initialValue={initialValue} options={paneOptions} />
                    </BrokenReferences>
                  )
                )
              })
            )
          })
        )
      })
    )
  )

function getInitialValueProps(document, props) {
  if (document) {
    return {}
  }

  const {template: definedTemplate} = props.options
  const {template: urlTemplate, ...urlParameters} = props.urlParameters || {}

  if (urlTemplate && definedTemplate && definedTemplate !== urlTemplate) {
    // eslint-disable-next-line no-console
    console.warn(
      `Conflicting templates: URL says "${urlParameters.template}", structure node says "${definedTemplate}". Using "${definedTemplate}".`
    )
  }

  const {options = {}} = props
  const template = options.template || urlTemplate
  const typeTemplates = getTemplatesBySchemaType(options.type)

  const parameters = {...options.templateParameters, ...urlParameters}
  let templateName = template

  // If we have not specified a specific template, and we only have a single
  // template available for a schema type, use it
  if (!template && typeTemplates.length === 1) {
    templateName = typeTemplates[0].id
  }

  return {templateName, parameters}
}

function resolveInitialValueWithParameters(templateName, parameters) {
  if (!templateExists(templateName)) {
    // eslint-disable-next-line no-console
    console.warn('Template "%s" not defined, using empty initial value', templateName)
    return of({isResolving: false, initialValue: undefined})
  }

  return from(resolveInitialValue(getTemplateById(templateName), parameters)).pipe(
    map(initialValue => ({isResolving: false, initialValue}))
  )
}

export default withInitialValue
