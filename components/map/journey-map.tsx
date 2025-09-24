"use client"

import dynamic from 'next/dynamic'
import { useMemo } from 'react'

// This component acts as a wrapper to dynamically load the actual map component
// only on the client side. This is crucial to prevent errors during Server-Side Rendering (SSR).
const JourneyMap = (props: any) => {
  const MapClient = useMemo(
    () =>
      dynamic(() => import('./journey-map-client'), {
        loading: () => (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Đang tải bản đồ...</p>
            </div>
          </div>
        ),
        ssr: false, // Ensure it's never rendered on the server
      }),
    []
  )

  return <MapClient {...props} />
}

export default JourneyMap

