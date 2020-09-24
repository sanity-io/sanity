import {useContext} from 'react'
import {ScrollContext} from './scrollContext'

export function useScroll() {
  return useContext(ScrollContext)
}
