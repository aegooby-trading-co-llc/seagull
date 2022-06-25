/**
 * @generated SignedSource<<c8126c18a03f09f7491b5a180eea640e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type AppQuery$variables = {};
export type AppQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"IndexFragment">;
};
export type AppQuery = {
  response: AppQuery$data;
  variables: AppQuery$variables;
};

const node: ConcreteRequest = {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "AppQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "IndexFragment"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "AppQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "penis",
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "14ea9733896c0ca13fccf79e17b01331",
    "id": null,
    "metadata": {},
    "name": "AppQuery",
    "operationKind": "query",
    "text": "query AppQuery {\n  ...IndexFragment\n}\n\nfragment IndexFragment on Query {\n  penis\n}\n"
  }
};

(node as any).hash = "83a654e2af1abea486b06e1c2868f667";

export default node;
