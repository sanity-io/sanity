import {SerializeOptions} from '../StructureNodes'
import {View, GenericViewBuilder} from './View'

export class FormViewBuilder extends GenericViewBuilder<Partial<View>, FormViewBuilder> {
  protected spec: Partial<View>

  constructor(spec?: Partial<View>) {
    super()
    this.spec = {id: 'editor', title: 'Editor', ...(spec ? spec : {})}
  }

  serialize(options: SerializeOptions = {path: []}): View {
    const base = super.serialize(options)
    return {
      ...base,
      type: 'form',
    }
  }

  clone(withSpec?: Partial<View>): FormViewBuilder {
    const builder = new FormViewBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
