import * as React from "react"; 
import GraphiQL from 'graphiql';
import 'graphiql/graphiql.min.css';

interface Props {
    endpoint: string
}
export function Graphiql(props: Props): React.ReactElement {
    return (<GraphiQL
      // style={{ height: '100vh' }}
      headerEditorEnabled
      fetcher={async (graphQLParams, options) => {
        const data = await fetch(
          props.endpoint,
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              //...options.headers,
            },
            body: JSON.stringify(graphQLParams),
            credentials: 'same-origin',
          },
        );
        return data.json().catch(() => data.text());
      }}
    />);
    }
  
