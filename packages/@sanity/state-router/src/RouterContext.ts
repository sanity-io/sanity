import React, {useContext} from 'react'

export const RouterContext = React.createContext({})
export const useRouter = () => useContext(RouterContext)
