import FunkyEditor from '../components/FunkyEditor/FunkyEditor'
import Slider from '../components/Slider/Slider'
import {get} from 'lodash'

export default function resolveInput(type) {
  if (type.name === 'number' && get(type, 'options.range')) {
    return Slider
  }

  if (type.name === 'array' && type.of.find((ofType) => ofType.name === 'block')) {
    return FunkyEditor
  }

  return false
}
