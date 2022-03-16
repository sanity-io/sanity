export type {Template} from './Template'

// the T named export is to workaround esModuleInterop bugs
export {builder as default, builder as T} from './builder'
export {prepareTemplates} from './prepareTemplates'
export {resolveInitialValue, isBuilder} from './resolve'
export {resolveInitialValueForType, resolveInitialObjectValue} from './resolveInitialValueForType'
export {TemplateBuilder} from './Template'
export {
  templateExists,
  getTemplateById,
  getTemplatesBySchemaType,
  getParameterlessTemplatesBySchemaType,
} from './templates'
export {validateTemplates} from './validate'
