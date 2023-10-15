# Payload Graphql View Plugin

[![NPM](https://img.shields.io/npm/v/@innovixx/payload-graphql-view-plugin)](https://www.npmjs.com/package/@innovixx/payload-graphql-view-plugin)

A plugin for [Payload](https://github.com/payloadcms/payload) that adds a graphql view with a graphql IDE to collections and globals.

Core features:

  - add a graphql view to collections and globals

## Installation

```bash
  yarn add @innovixx/payload-graphql-view-plugin
  # OR
  npm i @innovixx/payload-graphql-view-plugin
```

## Basic Usage

In the `plugins` array of your [Payload config](https://payloadcms.com/docs/configuration/overview), call the plugin with [options](#options):

```js
import { buildConfig } from 'payload/config';
import GraphqlPlugin from '@innovixx/payload-graphql-view-plugin';

const config = buildConfig({
  collections: [
    {
      slug: 'pages',
      fields: []
    },
    {
      slug: 'media',
      upload: {
        staticDir: // path to your static directory,
      },
      fields: []
    }
  ],
  plugins: [
    GraphqlPlugin({
      collections: ['pages']
    })
  ]
});

export default config;
```

### Options

- `collections` : string[] | optional

  An array of collection slugs to add the Grapqhl view onto. If not provided, the Grapqhl view will be added to all collections.

- `globals` : string[] | optional

  An array of global slugs to add the Grapqhl view onto. If not provided, the Grapqhl view will be added to all globals.

- `graphqlUrl` : string | optional

  Override url to the graphql endpoint.

## TypeScript

All types can be directly imported:

```js
import {
  PluginConfig,
} from '@innovixx/payload-graphql-view-plugin/types';
```

## Development

To actively develop or debug this plugin you can either work directly within the demo directory of this repo, or link your own project.

1. #### Internal Demo

   This repo includes a fully working, self-seeding instance of Payload that installs the plugin directly from the source code. This is the easiest way to get started. To spin up this demo, follow these steps:

   1. First clone the repo
   1. Then, `cd YOUR_PLUGIN_REPO && yarn && cd demo && yarn && yarn cleanDev`
   1. Now open `http://localhost:3000/admin` in your browser
   1. Enter username `admin@innovixx.co.uk` and password `Pa$$w0rd!`

   That's it! Changes made in `./src` will be reflected in your demo. Keep in mind that the demo database is automatically seeded on every startup, any changes you make to the data get destroyed each time you reboot the app.

1. #### Linked Project

   You can alternatively link your own project to the source code:

   1. First clone the repo
   1. Then, `cd YOUR_PLUGIN_REPO && yarn && cd demo && cp env.example .env && yarn && yarn dev`
   1. Now `cd` back into your own project and run, `yarn link @innovixx/payload-graphql-view-plugin`
   1. If this plugin using React in any way, continue to the next step. Otherwise skip to step 7.
   1. From your own project, `cd node_modules/react && yarn link && cd ../react-dom && yarn link && cd ../../`
   1. Then, `cd YOUR_PLUGIN_REPO && yarn link react react-dom`

   All set! You can now boot up your own project as normal, and your local copy of the plugin source code will be used. Keep in mind that changes to the source code require a rebuild, `yarn build`.

   You might also need to alias these modules in your Webpack config. To do this, open your project's Payload config and add the following:

   ```js
   import { buildConfig } from "payload/config";

   export default buildConfig({
     admin: {
       webpack: (config) => ({
         ...config,
         resolve: {
           ...config.resolve,
           alias: {
             ...config.resolve.alias,
             react: path.join(__dirname, "../node_modules/react"),
             "react-dom": path.join(__dirname, "../node_modules/react-dom"),
             payload: path.join(__dirname, "../node_modules/payload"),
             "@innovixx/payload-graphql-view-plugin": path.join(
               __dirname,
               "../../payload/payload-graphql-view-plugin/src"
             ),
           },
         },
       }),
     },
   });
   ```