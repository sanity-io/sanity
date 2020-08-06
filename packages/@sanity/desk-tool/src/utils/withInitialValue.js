/* eslint-disable max-nested-callbacks */
import React from 'react'
import {streamingComponent} from 'react-props-stream'
import {merge, from, of} from 'rxjs'
import {
  map,
  switchMap,
  scan,
  filter,
  distinctUntilChanged,
  catchError,
  debounceTime
} from 'rxjs/operators'
import schema from 'part:@sanity/base/schema'
import {observePaths} from 'part:@sanity/base/preview'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import {PaneRouterContext} from '../contexts/PaneRouterContext'
import {ErrorPane} from '../panes/errorPane'
import {LoadingPane} from '../panes/loadingPane'
import BrokenReferences from '../components/BrokenReferences'
import {
  templateExists,
  getTemplateById,
  getTemplatesBySchemaType,
  resolveInitialValue
} from '@sanity/base/initial-value-templates'

const withInitialValue = Pane => {
  const WithInitialValueStream = streamingComponent(props$ =>
    props$.pipe(
      switchMap(props => {
        const {options, paneContext, ...paneProps} = props
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
          // Prevent rapid re-resolving when transitioning between different templates
          debounceTime(25),
          switchMap(document => {
            const {templateName, parameters} = getInitialValueProps(document, props, paneContext)
            const shouldResolve = Boolean(templateName)
            const paneOptions = resolvePaneOptions(props, templateName, document)
            const documentType = paneOptions.type

            if (!shouldResolve) {
              // Wrap in broken references component to prevent "reload"
              // when going from missing document to a document that exists
              return of(
                <BrokenReferences document={{}} type={documentType} schema={schema}>
                  <Pane {...paneProps} options={paneOptions} />
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
                    <ErrorPane {...props} title="Failed to resolve initial value">
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
                      <Pane {...paneProps} initialValue={initialValue} options={paneOptions} />
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

  const WithInitialValueWrapper = props => (
    <PaneRouterContext.Consumer>
      {context => <WithInitialValueStream {...props} paneContext={context} />}
    </PaneRouterContext.Consumer>
  )

  return WithInitialValueWrapper
}

function getInitialValueProps(document, props, paneContext) {
  if (document) {
    return {}
  }

  const payload = paneContext.payload || {}
  const urlTemplate = (paneContext.params || {}).template
  const definedTemplate = props.options.template

  if (urlTemplate && definedTemplate && definedTemplate !== urlTemplate) {
    // eslint-disable-next-line no-console
    console.warn(
      `Conflicting templates: URL says "${urlTemplate}", structure node says "${definedTemplate}". Using "${definedTemplate}".`
    )
  }

  const {options = {}} = props
  const template = definedTemplate || urlTemplate
  const typeTemplates = getTemplatesBySchemaType(options.type)

  const parameters = {...options.templateParameters, ...payload}
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

function resolvePaneOptions(props, templateName, document) {
  const {options} = props
  const hasDefinedType = options.type && options.type !== '*'
  const typeFromOptions = hasDefinedType ? options.type : undefined
  let documentType = typeFromOptions || (document && document._type)
  if (!documentType && templateName) {
    const template = getTemplateById(templateName)
    documentType = template && template.schemaType
  }

  // If we were not passed a schema type, use the resolved value if available
  return hasDefinedType ? options : {...options, type: documentType}
}

export default withInitialValue
