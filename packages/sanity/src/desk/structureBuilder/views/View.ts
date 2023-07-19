import {kebabCase} from 'lodash'
import {Serializable, SerializeOptions, SerializePath} from '../StructureNodes'
import {HELP_URL, SerializeError} from '../SerializeError'
import {validateId} from '../util/validateId'
import {View} from '../types'
import {ComponentViewBuilder} from './ComponentView'
import {FormViewBuilder} from './FormView'

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
 * Class for building generic views.
 *
 * @public
 */
export abstract class GenericViewBuilder<TView extends Partial<BaseView>, ConcreteImpl>
  implements Serializable<BaseView>
{
  /** Generic view option object */
  protected spec: TView = {} as TView

  /** Set generic view ID
   * @param id - generic view ID
   * @returns generic view builder based on ID provided.
   */
  id(id: string): ConcreteImpl {
    return this.clone({id})
  }
  /** Get generic view ID
   * @returns generic view ID
   */
  getId(): TView['id'] {
    return this.spec.id
  }

  /** Set generic view title
   * @param title - generic view title
   * @returns generic view builder based on title provided and (if provided) its ID.
   */
  title(title: string): ConcreteImpl {
    return this.clone({title, id: this.spec.id || kebabCase(title)})
  }

  /** Get generic view title
   * @returns generic view title
   */
  getTitle(): TView['title'] {
    return this.spec.title
  }

  /** Set generic view icon
   * @param icon - generic view icon
   * @returns generic view builder based on icon provided.
   */
  icon(icon: React.ComponentType | React.ReactNode): ConcreteImpl {
    return this.clone({icon})
  }

  /** Get generic view icon
   * @returns generic view icon
   */
  getIcon(): TView['icon'] {
    return this.spec.icon
  }

  /** Serialize generic view
   * @param options - serialization options. See {@link SerializeOptions}
   * @returns generic view object based on path provided in options. See {@link BaseView}
   */
  serialize(options: SerializeOptions = {path: []}): BaseView {
    const {id, title, icon} = this.spec
    if (!id) {
      throw new SerializeError(
        '`id` is required for view item',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (!title) {
      throw new SerializeError(
        '`title` is required for view item',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.TITLE_REQUIRED)
    }

    return {
      id: validateId(id, options.path, options.index),
      title,
      icon,
    }
  }

  /** Clone generic view builder (allows for options overriding)
   * @param withSpec - Partial generic view builder options. See {@link BaseView}
   * @returns Generic view builder.
   */
  abstract clone(withSpec?: Partial<BaseView>): ConcreteImpl
}

function isSerializable(view: BaseView | Serializable<BaseView>): view is Serializable<BaseView> {
  return typeof (view as Serializable<BaseView>).serialize === 'function'
}

/** @internal */
export function maybeSerializeView(
  item: View | Serializable<View>,
  index: number,
  path: SerializePath
): View {
  return isSerializable(item) ? item.serialize({path, index}) : item
}

/**
 * View builder. See {@link ComponentViewBuilder} and {@link FormViewBuilder}
 *
 * @public
 */
export type ViewBuilder = ComponentViewBuilder | FormViewBuilder
