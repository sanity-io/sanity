import {useCallback, useMemo, type MouseEvent, type ReactNode} from 'react'
import {useTranslation} from 'sanity'
import {Flex, PressArea, Text} from 'ui5'

import {usePane} from '../../../../components/pane/usePane'
import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {structureLocaleNamespace} from '../../../../i18n'
import {useResolvedPanesList} from '../../../../structureResolvers/useResolvedPanesList'
import {useDocumentPane} from '../../useDocumentPane'
import {useDocumentTitle} from '../../useDocumentTitle'
import {type DocumentTitleField, useDocumentTitleField} from '../useDocumentTitleField'
import {DocumentHeaderBreadcrumb} from './DocumentHeaderBreadcrumb'

export function DocumentHeaderTitle(): React.JSX.Element {
  const {connectionState, schemaType, title, value: documentValue, index} = useDocumentPane()
  const {paneDataItems} = useResolvedPanesList()
  const {title: documentTitle, error} = useDocumentTitle()
  const subscribed = Boolean(documentValue)
  const titleField = useDocumentTitleField()

  const {t} = useTranslation(structureLocaleNamespace)

  const hasMaximizedPane = useMemo(
    () => paneDataItems.some((paneData) => paneData.maximized),
    [paneDataItems],
  )

  if (connectionState === 'connecting' && !subscribed) {
    return <></>
  }

  // A structure-builder pane title is not the document preview title.
  if (title) {
    return <>{title}</>
  }

  if (!documentValue) {
    return (
      <FocusableDocumentTitle titleField={titleField}>
        {t('panes.document-header-title.new.text', {
          schemaType: schemaType?.title || schemaType?.name,
        })}
      </FocusableDocumentTitle>
    )
  }

  if (error) {
    return <>{t('panes.document-header-title.error.text', {error: error})}</>
  }

  return (
    <>
      {hasMaximizedPane ? (
        <DocumentHeaderBreadcrumb paneDataItems={paneDataItems} currentPaneIndex={index} />
      ) : (
        <FocusableDocumentTitle titleField={titleField}>
          {documentTitle || (
            <span style={{color: 'var(--card-muted-fg-color)'}}>
              {t('panes.document-header-title.untitled.text')}
            </span>
          )}
        </FocusableDocumentTitle>
      )}
    </>
  )
}

/**
 * Without an editable title field (no single field sets the title, or the
 * form is read-only) the header title stays plain text.
 */
function FocusableDocumentTitle(props: {titleField: DocumentTitleField; children: ReactNode}) {
  const {titleField, children} = props
  if (!titleField.editable) return children
  return <TitleFieldButton focus={titleField.focus}>{children}</TitleFieldButton>
}

/**
 * Wraps the title in a real button so it is keyboard operable, drawn as text:
 * the header title is not a toolbar control. A collapsed pane still uses the
 * title click to expand, so the button is only rendered while the pane is open.
 */
function TitleFieldButton(props: {focus: () => void; children: ReactNode}) {
  const {focus, children} = props
  const {activeViewId, views} = useDocumentPane()
  const {collapsed} = usePane()
  const {setView} = usePaneRouter()

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      // The pane header collapses when its title card is clicked.
      event.stopPropagation()

      const activeView = views.find((view) => view.id === activeViewId) ?? views[0]
      const formViewIndex = views.findIndex((view) => view.type === 'form')
      if (activeView && activeView.type !== 'form' && formViewIndex !== -1) {
        const formViewId = views[formViewIndex]?.id
        setView(formViewIndex === 0 ? null : (formViewId ?? null))
      }

      focus()
    },
    [activeViewId, focus, setView, views],
  )

  const handleMouseDown = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    // Leave focus where it is until the title field mounts and takes it.
    event.preventDefault()
  }, [])

  if (collapsed) {
    return children
  }

  // Sized to the title, so a click beside it still collapses the pane.
  return (
    // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- a CSS length, not copy
    <Flex as="span" maxWidth="100%" width="fit-content" alignItems="center">
      <PressArea
        data-testid="document-pane-title-field"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        type="button"
      >
        {/* A button is an atomic inline box, so the header's own ellipsis cannot reach into
        it. `trim` keeps the line box as short as the header's own trimmed title text. */}
        <Text as="span" size={1} trim truncate={1} weight="semibold">
          {children}
        </Text>
      </PressArea>
    </Flex>
  )
}
