import {get} from 'lodash'
import {FunkyEditor} from '../components/FunkyEditor'
import Slider from '../components/Slider/Slider'

export default function resolveInput(type: any) {
  if (type.name === 'number' && get(type, 'options.range')) {
    return Slider
  }

  if (type.name === 'array' && type.of.find((ofType: any) => ofType.name === 'block')) {
    return FunkyEditor
  }

  return false
}
