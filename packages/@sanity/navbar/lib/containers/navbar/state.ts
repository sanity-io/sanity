import {Observable, of} from 'rxjs'
// import {map, tap} from 'rxjs/operators'
import {Props} from '../../components/Navbar'
import {Props as ItemProps} from '../../components/NavbarItem'
import config from './config'
import itemParts from './itemParts'

// TODO:
// const resize$ = fromEvent(window, 'resize')
// const windowWidth$ = resize$.pipe(map(() => window.innerWidth))
// windowWidth$.pipe(tap(console.log)).subscribe()

const elements: Array<HTMLDivElement | null> = config.items.map(() => null)

export function setElement(el: HTMLDivElement | null, idx: number) {
  elements[idx] = el
}

// Build `items` prop
const items: Array<ItemProps> = config.items.map((itemConfig, idx) => {
  const {name} = itemConfig
  const itemPart = itemParts.find(i => i.name === name) || null
  if (!itemPart) {
    return {
      component: (() => null) as any,
      layout: {},
      minimized: false,
      name,
      options: {},
      setElement: (element: any) => setElement(element, idx)
    }
  }
  const layout = {...(itemConfig.layout || {}), ...((itemPart && itemPart.layout) || {})}
  const options = {...(itemConfig.options || {}), ...((itemPart && itemPart.options) || {})}
  const item: ItemProps = {
    component: itemPart.component,
    layout,
    minimized: false,
    name,
    options,
    setElement: element => setElement(element, idx)
  }
  return item
})

export const state$: Observable<Props> = of({items})
