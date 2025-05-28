import {type DuplicateDocumentActionComponent} from 'sanity'

export function createCustomDuplicateAction(
  originalAction: DuplicateDocumentActionComponent,
): DuplicateDocumentActionComponent {
  return function CustomDuplicateAction(props) {
    return originalAction({
      ...props,
      mapDocument: (document) => ({
        ...document,
        title: [document.title, '(duplicate)'].join(' '),
      }),
    })
  }
}
