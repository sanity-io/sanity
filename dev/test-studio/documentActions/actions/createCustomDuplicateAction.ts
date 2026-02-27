import {memoize} from 'lodash-es'
import {type DuplicateDocumentActionComponent} from 'sanity'

export const createCustomDuplicateAction = memoize(
  (useOriginalAction: DuplicateDocumentActionComponent): DuplicateDocumentActionComponent => {
    const useCustomDuplicateAction: DuplicateDocumentActionComponent = (props) => {
      return useOriginalAction({
        ...props,
        mapDocument: (document) => ({
          ...document,
          title: [document.title, '(duplicate)'].join(' '),
        }),
      })
    }
    useCustomDuplicateAction.displayName = 'CustomDuplicateAction'
    return useCustomDuplicateAction
  },
)
