import {InitialValueTemplateItem} from '../../../../templates'

export interface NewDocumentOption extends Omit<InitialValueTemplateItem, 'title'> {
  hasPermission: boolean
  // We are adding the title property to the InitialValueTemplateItem interface
  // because we need to be able to sort the options by title. The title will be
  // the same as the id if the title is not defined.
  title: string
}

export type PreviewLayout = 'inline' | 'default'

export type ModalType = 'dialog' | 'popover'
