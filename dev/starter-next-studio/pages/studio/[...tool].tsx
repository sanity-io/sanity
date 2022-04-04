/* eslint-disable react/react-in-jsx-scope */
import {useRouter} from 'next/router'
import {useEffect, useState} from 'react'
import Studio from '../../components/Studio'

export default function StudioPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return null

  const [basePath] = router.route.split('/[...tool]')
  return <Studio basePath={basePath} />
}
