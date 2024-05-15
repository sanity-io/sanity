import React, {useState} from 'react'

export const FormDialogContext = React.createContext({
  isFormDialogOpen: false,
  setIsFormDialogOpen: (value: boolean) => {},
})

export const FormDialogProvider = ({children}: {children: React.ReactNode}) => {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)

  return (
    <FormDialogContext.Provider value={{isFormDialogOpen, setIsFormDialogOpen}}>
      {children}
    </FormDialogContext.Provider>
  )
}
