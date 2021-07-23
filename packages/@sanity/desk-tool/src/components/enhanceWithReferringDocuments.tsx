import {SanityDocument} from '@sanity/types'
import React from 'react'
import {WithReferringDocuments} from 'part:@sanity/base/with-referring-documents'

export interface WithReferringDocumentsProps {
  referringDocuments: Record<string, any>[]
  isCheckingReferringDocuments: boolean
  published?: SanityDocument | null
}

export function enhanceWithReferringDocuments<ComponentProps extends WithReferringDocumentsProps>(
  WrappedComponent: React.ComponentType<ComponentProps>
): React.ComponentType<
  Omit<ComponentProps, 'referringDocuments' | 'isCheckingReferringDocuments'>
> {
  function EnhancedWithReferringDocuments(
    props: Omit<ComponentProps, 'referringDocuments' | 'isCheckingReferringDocuments'>
  ) {
    const renderChild = (renderProps: {
      isLoading: boolean
      referringDocuments: Record<string, any>
    }) => {
      const {isLoading, referringDocuments} = renderProps

      const componentProps: ComponentProps = {
        ...(props as ComponentProps),
        referringDocuments,
        isCheckingReferringDocuments: isLoading,
      }

      return <WrappedComponent {...componentProps} />
    }

    return props.published ? (
      <WithReferringDocuments id={props.published._id}>{renderChild}</WithReferringDocuments>
    ) : (
      renderChild({referringDocuments: [], isLoading: false})
    )
  }

  EnhancedWithReferringDocuments.displayName = `enhanceWithReferringDocuments(${
    WrappedComponent.displayName || WrappedComponent.name || 'WrappedComponent'
  })`

  return EnhancedWithReferringDocuments
}
