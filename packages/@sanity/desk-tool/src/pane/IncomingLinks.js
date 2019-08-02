import React from 'react'
import {streamingComponent} from 'react-props-stream'
import {distinctUntilChanged, tap, map, switchMap} from 'rxjs/operators'
import styles from '../components/styles/ReferringDocumentsList.css'
import schema from 'part:@sanity/base/schema'
import Preview from 'part:@sanity/base/preview'
import {List as DefaultList, Item as DefaultItem} from 'part:@sanity/components/lists/default'
import {IntentLink} from 'part:@sanity/base/router'
import {referencedPaths} from '../utils/referencedPaths'

function renderRef(ref) {
  const pathAsString = ref.path
    .map(segment => (typeof segment === 'string' ? segment : `@${segment._key}`))
    .join(' → ')
  return (
    <div key={pathAsString}>
      {ref.value._weak ? <span title="This is a weak reference">❄️</span> : null}
      {pathAsString}
    </div>
  )
}

export const IncomingLinks = streamingComponent(props$ =>
  props$.pipe(
    map(props => props.id),
    distinctUntilChanged(),
    switchMap(referencedPaths),
    map(docWithRefPaths =>
      docWithRefPaths.length > 0 ? (
        <details>
          <summary>
            {docWithRefPaths.length === 1
              ? 'Referenced in one other document'
              : `${docWithRefPaths.length} other documents references this`}
          </summary>
          <DefaultList className={styles.root}>
            {docWithRefPaths.map(({document, refs}) => {
              const schemaType = schema.get(document._type)
              return (
                <DefaultItem className={styles.item} key={document._id}>
                  <div
                    style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'center'}}
                  >
                    {schemaType ? (
                      <IntentLink
                        className={styles.link}
                        intent="edit"
                        params={{id: document._id, type: document._type}}
                      >
                        <Preview value={document} type={schemaType} />
                      </IntentLink>
                    ) : (
                      <div>
                        A document of the unknown type <em>{document._type}</em>
                      </div>
                    )}
                    <div
                      style={{
                        marginLeft: 10,
                        fontFamily: 'monospace',
                        fontWeight: 'bold'
                      }}
                    >
                      {refs.map(renderRef)}
                    </div>
                  </div>
                </DefaultItem>
              )
            })}
          </DefaultList>
        </details>
      ) : null
    )
  )
)
