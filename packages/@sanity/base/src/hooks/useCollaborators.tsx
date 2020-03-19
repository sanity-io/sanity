import {useState, useEffect} from 'react'
import {clients$} from 'part:@sanity/base/presence'

export default function useCollaborators() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    const subscription = clients$.subscribe(clients => {
      setUsers(
        clients.map(client => {
          return {
            ...client,
            sessions: client.sessions.map(session => ({
              ...session,
              state: session.state && session.state.find(state => state.namespace === 'formBuilder')
            })),
            status: client.sessions[0].type === 'sync' ? 'online' : 'inactive'
          }
        })
      )
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [clients$])
  return users
}
