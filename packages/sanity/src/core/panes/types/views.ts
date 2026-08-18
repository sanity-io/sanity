import {type SanityDocument, type SchemaType} from '@sanity/types'

/**
 * Interface for base view
 *
 * @public */
export interface BaseView {
  /** View id */
  id: string
  /** View Title */
  title: string
  /** View Icon */
  icon?: React.ComponentType | React.ReactNode
}

/**
 * Interface for form views.
 *
 * @public */
export interface FormView extends BaseView {
  type: 'form'
}

/**
 * User view component
 *
 * @public */
export type UserViewComponent<TOptions = Record<string, any>> = React.ComponentType<{
  document: {
    draft: SanityDocument | null
    displayed: Partial<SanityDocument>
    historical: Partial<SanityDocument> | null
    published: SanityDocument | null
  }
  documentId: string
  options: TOptions
  schemaType: SchemaType
}>

/**
 * Interface for component views.
 *
 * @public */
export interface ComponentView<TOptions = Record<string, any>> extends BaseView {
  type: 'component'
  /** Component view components. See {@link UserViewComponent} */
  component: UserViewComponent
  /** Component view options */
  options: TOptions
}

/**
 * View. See {@link FormView} and {@link ComponentView}
 *
 * @public
 */
export type View = FormView | ComponentView
