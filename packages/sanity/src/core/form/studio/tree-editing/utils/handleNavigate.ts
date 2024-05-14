import {toString} from '@sanity/util/paths'
import {type Path} from 'sanity'

export function handleNavigate(path: Path, onPathSelect: (path: Path) => void): void {
  document.getElementById('tree-editing-form')?.scroll(0, 0) // reset scroll position

  if (path[path.length - 1].hasOwnProperty('_key')) {
    // move this logic out so it can be used in the breadcrumbs
    onPathSelect(path)
  } else {
    requestAnimationFrame(() => {
      const elementPath = toString(path)
      const element = document.getElementById(elementPath)
      element?.scrollIntoView({behavior: 'smooth'})
    })

    onPathSelect(path.slice(0, path.length - 1))
  }
}
