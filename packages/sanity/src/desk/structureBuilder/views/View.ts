import {kebabCase} from 'lodash'
import {Serializable, SerializeOptions, SerializePath} from '../StructureNodes'
import {HELP_URL, SerializeError} from '../SerializeError'
import {validateId} from '../util/validateId'
import {ComponentViewBuilder} from './ComponentView'
import {FormViewBuilder} from './FormView'
import {View} from '../types'

export interface BaseView {
  id: string
  title: string
  icon?: React.ComponentType | React.ReactNode
}

export abstract class GenericViewBuilder<TView extends Partial<BaseView>, ConcreteImpl>
  implements Serializable<BaseView>
{
  protected spec: TView = {} as TView

  id(id: string): ConcreteImpl {
    return this.clone({id})
  }

  getId(): TView['id'] {
    return this.spec.id
  }

  title(title: string): ConcreteImpl {
    return this.clone({title, id: this.spec.id || kebabCase(title)})
  }

  getTitle(): TView['title'] {
    return this.spec.title
  }

  icon(icon: React.ComponentType | React.ReactNode): ConcreteImpl {
    return this.clone({icon})
  }

  getIcon(): TView['icon'] {
    return this.spec.icon
  }

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

  abstract clone(withSpec?: Partial<BaseView>): ConcreteImpl
}

function isSerializable(view: BaseView | Serializable<BaseView>): view is Serializable<BaseView> {
  return typeof (view as Serializable<BaseView>).serialize === 'function'
}

export function maybeSerializeView(
  item: View | Serializable<View>,
  index: number,
  path: SerializePath
): View {
  return isSerializable(item) ? item.serialize({path, index}) : item
}

export type ViewBuilder = ComponentViewBuilder | FormViewBuilder
