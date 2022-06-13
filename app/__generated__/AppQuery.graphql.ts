/**
 * @generated SignedSource<<c91e4dc1d5ac0945979b62ef72b7f49e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type AppQuery$variables = {};
export type AppQuery$data = {
  readonly penis: string | null;
};
export type AppQuery = {
  response: AppQuery$data;
  variables: AppQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "penis",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "AppQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "AppQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "d3d94f6b565810ced185b2c4c7c9b2cc",
    "id": null,
    "metadata": {},
    "name": "AppQuery",
    "operationKind": "query",
    "text": "query AppQuery {\n  penis\n}\n"
  }
};
})();

(node as any).hash = "b7a12eb2add5cd683ad1bc7b6645c2dd";

export default node;
