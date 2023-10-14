import React, { FunctionComponent } from 'react'
import { createGraphiQLFetcher } from '@graphiql/toolkit'
import { GraphiQL } from 'graphiql'
import { AdminViewComponent, AdminViewProps } from 'payload/config'

import './styles.scss'

type Props = AdminViewProps & {
  initialEndpoint?: string
}

export const GraphqlViewComponent: FunctionComponent<Props> = ({ initialEndpoint }: Props) => {
  const baseClass = 'invx__graphql-view'

  if (!initialEndpoint) return <div className={baseClass}>No endpoint provided</div>

  const fetcher = createGraphiQLFetcher({
    url: initialEndpoint as string,
  })

  return (
    <div className={baseClass}>
      <GraphiQL fetcher={fetcher} editorTheme="codemirror light" />
    </div>
  )
}
