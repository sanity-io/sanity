import {useContext} from 'react'
import {ModalContext} from './ModalContext'

export function useModal() {
  return useContext(ModalContext)
}
