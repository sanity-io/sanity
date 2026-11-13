import {type ComponentProps} from 'react'
import {getDefaultVariant, useDocumentPreviewValues, usePerspective, useTranslation} from 'sanity'
import {StateLink} from 'sanity/router'
import {Box, Flex, PressArea} from 'ui5'

import {
  BreadcrumbItemContent,
  SeparatorItem,
} from '../../core/form/components/breadcrumbs/DialogBreadcrumbs'
import {breadcrumbItem} from '../../core/form/components/breadcrumbs/DialogBreadcrumbs.css'
import {presentationLocaleNamespace} from '../i18n'

function useCrumbTitle(documentId: string, documentType: string): string | undefined {
  const {t} = useTranslation(presentationLocaleNamespace)
  const {perspectiveStack, selectedVariantNames} = usePerspective()
  const {value, isLoading} = useDocumentPreviewValues({
    documentId,
    documentType,
    perspectiveStack,
    variant: getDefaultVariant(selectedVariantNames),
  })

  if (isLoading) return undefined
  return value?.title || t('document-breadcrumb.untitled.text')
}

function MainDocumentCrumb(props: {
  documentId: string
  documentType: string
  linkState: ComponentProps<typeof StateLink>['state']
}) {
  const {documentId, documentType, linkState} = props
  const title = useCrumbTitle(documentId, documentType)

  return (
    <>
      <Box className={breadcrumbItem} minWidth="0">
        <PressArea
          as={StateLink}
          state={linkState}
          data-testid="presentation-main-document-link"
          title={title}
          aria-label={title}
        >
          <BreadcrumbItemContent title={title} capitalize={false} />
        </PressArea>
      </Box>
      <SeparatorItem>/</SeparatorItem>
    </>
  )
}

/**
 * The navigation row of the Presentation document pane. The open document is always the bold
 * current crumb; when it is not the route's main document, the main document comes first as a
 * link back to it. The row renders in every case so the pane header never moves.
 */
export function DocumentBreadcrumb(props: {
  documentId: string
  documentType: string
  /** Set only when the open document is not the route's main document. */
  mainDocument?: {
    id: string
    type: string
    linkState: ComponentProps<typeof StateLink>['state']
  }
}): React.JSX.Element {
  const {documentId, documentType, mainDocument} = props
  const documentTitle = useCrumbTitle(documentId, documentType)

  return (
    <Flex
      alignItems="center"
      data-testid="presentation-document-breadcrumb"
      style={{minWidth: 0, width: '100%', flexWrap: 'nowrap'}}
    >
      {mainDocument && (
        <MainDocumentCrumb
          documentId={mainDocument.id}
          documentType={mainDocument.type}
          linkState={mainDocument.linkState}
        />
      )}
      <Box
        className={breadcrumbItem}
        minWidth="0"
        aria-current="location"
        data-testid="presentation-document-breadcrumb-current"
      >
        <BreadcrumbItemContent title={documentTitle} isSelected capitalize={false} />
      </Box>
    </Flex>
  )
}
