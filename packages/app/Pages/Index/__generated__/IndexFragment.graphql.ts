/**
 * @generated SignedSource<<81c323e14f1188eb264c826d4512453b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type IndexFragment$data = {
  readonly penis: string;
  readonly " $fragmentType": "IndexFragment";
};
export type IndexFragment$key = {
  readonly " $data"?: IndexFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"IndexFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "IndexFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "penis",
      "storageKey": null
    }
  ],
  "type": "Query",
  "abstractKey": null
};

(node as any).hash = "9697e82222e179e7e9fa825be2c45f09";

export default node;
