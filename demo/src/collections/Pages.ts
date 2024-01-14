import type { CollectionConfig } from 'payload/types'

const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'text',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      // NOTE: in order for position: 'sidebar' to work here,
      // the first field of this config must be of type `tabs`,
      // and this field must be a sibling of it
      // See `./Posts` or the `../../README.md` for more info
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'date',
      type: 'date',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'blocks',
      type: 'blocks',
      minRows: 0,
      maxRows: 4,
      blocks: [
        {
          slug: 'title',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}

export default Pages
