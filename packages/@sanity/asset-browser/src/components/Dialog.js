import React, {useCallback} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {assetsDelete} from '../modules/assets'
import {dialogClear} from '../modules/dialog'
import DialogConflicts from './DialogConflicts'
import DialogRefs from './DialogRefs'

const Dialog = () => {
  const {asset, type} = useSelector(state => state.dialog)
  const dispatch = useDispatch()

  const handleClose = useCallback(() => {
    dispatch(dialogClear())
  }, [])

  const handleDelete = useCallback(_asset => {
    dispatch(assetsDelete(_asset, 'dialog'))
  }, [])

  if (asset && type === 'conflicts') {
    return <DialogConflicts asset={asset} onClose={handleClose} />
  }

  if (asset && type === 'refs') {
    return <DialogRefs asset={asset} onClose={handleClose} onDelete={handleDelete} />
  }

  return null
}

export default Dialog
