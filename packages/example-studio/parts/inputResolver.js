import Slider from '../components/Slider/Slider'
import {get} from 'lodash'
import CodeEditor from 'part:@sanity/form-builder/input/code-editor'

export default function resolveInput(type) {
  if (type.name === 'number' && get(type, 'options.range')) {
    return Slider
  }

  if (type.name === 'code') {
    return CodeEditor
  }
  return false
}
