import {useState, useEffect} from 'react'
import {clients$} from 'part:@sanity/base/presence'

export default function useCollaborators() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    const subscription = clients$.subscribe(clients => {
      setUsers(
        clients.map(client => ({
          ...client,
          status: client.sessions[0].type === 'sync' ? 'online' : 'offline'
        }))
      )
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [clients$])
  return users
}
