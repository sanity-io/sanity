import Slider from '../components/Slider/Slider'
import {get} from 'lodash'

export default function resolveInput(type) {
  if (type.name === 'number' && get(type, 'options.range')) {
    return Slider
  }
}
