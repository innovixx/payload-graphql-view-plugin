import React, { FunctionComponent, useEffect, useState } from 'react'
import { createGraphiQLFetcher } from '@graphiql/toolkit'
import GraphiQLComponent from 'graphiql'
import { AdminViewProps } from 'payload/config'
import usePayloadApi from 'payload/dist/admin/hooks/usePayloadAPI'
import { CollectionConfig, GlobalConfig } from 'payload/dist/exports/types'

import './styles.scss'

type Props = AdminViewProps & {
  initialEndpoint?: string
  type: 'collection' | 'global'
  collection?: CollectionConfig
  global?: GlobalConfig
  maxDepth?: number
}

export const GraphqlViewComponent: FunctionComponent<Props> = props => {
  const baseClass = 'invx__graphql-view'

  const [documentId, setDocumentId] = useState(window.location.pathname.split('/')[4])
  const [ready, setReady] = useState(false)

  const [{ data }] = usePayloadApi('/api/getGraphqlQuery', {
    initialParams: {
      slug: props.collection?.slug || props.global?.slug || '',
      type: props.type,
      depth: props.maxDepth,
    },
  })

  useEffect(() => {
    setReady(false)
    setDocumentId(window.location.pathname.split('/')[4])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.location.pathname])

  useEffect(() => {
    if (Object.keys(data).length !== 0) {
      Object.keys(window.localStorage).forEach(key => {
        if (key.startsWith('graphiql:')) {
          window.localStorage.removeItem(key)
        }
      })

      if (props.type === 'collection') {
        window.localStorage.setItem('graphiql:variables', `{"id": "${documentId}"}`)
      }
      window.localStorage.setItem('graphiql:query', data)
      setReady(true)
    }
  }, [data, documentId, props.type])

  const fetcher = createGraphiQLFetcher({
    url: props.initialEndpoint as string,
  })

  return (
    <div className={baseClass} key={documentId}>
      {ready && (
        <GraphiQLComponent
          fetcher={fetcher}
          editorTheme="codemirror light"
          key={documentId}
          storage={undefined}
          defaultQuery={data}
        />
      )}
    </div>
  )
}
