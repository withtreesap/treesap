// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $api_route_ from "./routes/api/[...route].ts";
import * as $cms_layout from "./routes/cms/_layout.tsx";
import * as $cms_collections_collection_id_ from "./routes/cms/collections/[collection]/[id].tsx";
import * as $cms_collections_collection_create from "./routes/cms/collections/[collection]/create.tsx";
import * as $cms_collections_collection_edit from "./routes/cms/collections/[collection]/edit.tsx";
import * as $cms_collections_collection_index from "./routes/cms/collections/[collection]/index.tsx";
import * as $cms_collections_create from "./routes/cms/collections/create.tsx";
import * as $cms_globals_global_edit from "./routes/cms/globals/[global]/edit.tsx";
import * as $cms_globals_global_index from "./routes/cms/globals/[global]/index.tsx";
import * as $cms_globals_create from "./routes/cms/globals/create.tsx";
import * as $cms_index from "./routes/cms/index.tsx";
import * as $index from "./routes/index.tsx";
import * as $Counter from "./islands/Counter.tsx";
import * as $DeleteItemButton from "./islands/DeleteItemButton.tsx";
import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/api/[...route].ts": $api_route_,
    "./routes/cms/_layout.tsx": $cms_layout,
    "./routes/cms/collections/[collection]/[id].tsx":
      $cms_collections_collection_id_,
    "./routes/cms/collections/[collection]/create.tsx":
      $cms_collections_collection_create,
    "./routes/cms/collections/[collection]/edit.tsx":
      $cms_collections_collection_edit,
    "./routes/cms/collections/[collection]/index.tsx":
      $cms_collections_collection_index,
    "./routes/cms/collections/create.tsx": $cms_collections_create,
    "./routes/cms/globals/[global]/edit.tsx": $cms_globals_global_edit,
    "./routes/cms/globals/[global]/index.tsx": $cms_globals_global_index,
    "./routes/cms/globals/create.tsx": $cms_globals_create,
    "./routes/cms/index.tsx": $cms_index,
    "./routes/index.tsx": $index,
  },
  islands: {
    "./islands/Counter.tsx": $Counter,
    "./islands/DeleteItemButton.tsx": $DeleteItemButton,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
