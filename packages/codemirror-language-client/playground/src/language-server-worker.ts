import { startServer, allChecks } from '@shopify/theme-language-server-browser';
import { isDependencyInjectionMessage } from './messages';
import { URI } from 'vscode-languageserver-types';

/**
 * These are replaced at build time by the contents of
 * @shopify/theme-check-docs-updater's DocsManager
 */
declare global {
  export const WEBPACK_TAGS: any[];
  export const WEBPACK_FILTERS: any[];
  export const WEBPACK_OBJECTS: any[];
  export const WEBPACK_SYSTEM_TRANSLATIONS: any;
  export const WEBPACK_TRANSLATIONS_SCHEMA: string;
  export const WEBPACK_SECTION_SCHEMA: string;
}

const tags = WEBPACK_TAGS;
const filters = WEBPACK_FILTERS;
const objects = WEBPACK_OBJECTS;
const systemTranslations = WEBPACK_SYSTEM_TRANSLATIONS;
// const sectionSchema = WEBPACK_SECTION_SCHEMA;
const translationsSchema = WEBPACK_TRANSLATIONS_SCHEMA;

const baseURI = `https://schemas.shopify.dev/`;

const inputSettingsSchema = JSON.stringify({
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: `${baseURI}/schemas/input_settings`,
  type: 'array',
  description: 'Section specific settings.',
  items: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description:
          'The unique identifier for the setting, which is used to access the setting value.',
      },
      type: {
        type: 'string',
        description: 'The input type of the setting.',
        enum: [
          'article',
          'blog',
          'checkbox',
          'collection_list',
          'collection',
          'color_background',
          'color_scheme_group',
          'color_scheme',
          'color',
          'font_picker',
          'header',
          'html',
          'image_picker',
          'inline_richtext',
          'link_list',
          'liquid',
          'number',
          'page',
          'paragraph',
          'product_list',
          'product',
          'radio',
          'range',
          'richtext',
          'select',
          'text',
          'textarea',
          'text_alignment',
          'url',
          'video_url',
          'video',
        ],
      },
      label: {
        type: 'string',
        description: 'The label for the setting, which will show in the theme editor.',
      },
      default: {
        type: ['string', 'number', 'boolean'],
        description: 'The default value for the setting.',
      },
      info: {
        type: 'string',
        description: 'An option for informational text about the setting.',
      },
    },
    if: {
      anyOf: [
        {
          properties: {
            type: {
              const: 'header',
            },
          },
        },
        {
          properties: {
            type: {
              const: 'paragraph',
            },
          },
        },
      ],
    },
    then: {
      required: ['type'],
    },
    else: {
      required: ['id', 'type', 'label'],
    },
  },
  minItems: 0,
});

const sectionSchema = JSON.stringify({
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: `${baseURI}/schemas/section`,
  title: 'Shopify Liquid Theme Section Schema',
  type: 'object',
  additionalProperties: false,
  definitions: {
    sectionToggle: {
      type: 'object',
      description: 'Restrict the section to certain template page types and section group types.',
      properties: {
        templates: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              '*',
              '404',
              'article',
              'blog',
              'captcha',
              'cart',
              'collection',
              'customers/account',
              'customers/activate_account',
              'customers/addresses',
              'customers/login',
              'customers/order',
              'customers/register',
              'customers/reset_password',
              'gift_card',
              'index',
              'list-collections',
              'metaobject',
              'page',
              'password',
              'policy',
              'product',
              'search',
            ],
          },
          uniqueItems: true,
        },
        groups: {
          type: 'array',
          items: {
            type: 'string',
          },
          uniqueItems: true,
        },
      },
      additionalProperties: false,
    },
  },
  properties: {
    name: {
      type: 'string',
      description: 'The section title shown in the theme editor.',
    },
    tag: {
      type: 'string',
      description: 'The HTML element to use for the section.',
      enum: ['article', 'aside', 'div', 'footer', 'header', 'section'],
    },
    class: {
      type: 'string',
      description: 'Additional CSS class for the section.',
    },
    limit: {
      type: 'integer',
      description: 'The number of times a section can be added to a template or section group.',
      minimum: 1,
      maximum: 2,
    },
    settings: {
      description: 'Section specific settings.',
      $ref: `${baseURI}/schemas/input_settings`,
    },
    max_blocks: {
      type: 'integer',
      description: 'The maximum number of blocks allowed in the section.',
      minimum: 1,
      maximum: 50,
    },
    blocks: {
      type: 'array',
      description: 'Section blocks.',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The block name.',
          },
          type: {
            type: 'string',
            description: 'The block type.',
          },
          settings: {
            description: 'Block settings.',
            $ref: `${baseURI}/schemas/input_settings`,
          },
        },
        if: {
          properties: {
            type: {
              const: '@app',
            },
          },
        },
        then: {
          required: ['type'],
        },
        else: {
          required: ['name', 'type'],
        },
      },
    },
    presets: {
      type: 'array',
      description: 'Section presets.',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The preset name.',
          },
          settings: {
            type: 'object',
            description: 'Default values for settings.',
            additionalProperties: {
              anyOf: [
                { type: 'number' },
                { type: 'boolean' },
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
              ],
            },
          },
          blocks: {
            type: 'array',
            description: 'Default blocks.',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  description: 'The block type.',
                },
                settings: {
                  type: 'object',
                  description: 'Block settings.',
                  additionalProperties: {
                    anyOf: [
                      { type: 'number' },
                      { type: 'boolean' },
                      { type: 'string' },
                      {
                        type: 'array',
                        items: { type: 'string' },
                      },
                    ],
                  },
                },
              },
              required: ['type'],
            },
          },
        },
        required: ['name'],
      },
    },
    default: {
      type: 'object',
      description: 'Default configuration for statically rendered sections.',
      properties: {
        settings: {
          type: 'object',
          description: 'Default values for settings.',
          additionalProperties: {
            anyOf: [
              { type: 'number' },
              { type: 'boolean' },
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
            ],
          },
        },
        blocks: {
          type: 'array',
          description: 'Default blocks.',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: 'The block type.',
              },
              settings: {
                type: 'object',
                description: 'Block settings.',
                additionalProperties: {
                  anyOf: [
                    { type: 'number' },
                    { type: 'boolean' },
                    { type: 'string' },
                    { type: 'array', items: { type: 'string' } },
                  ],
                },
              },
            },
            required: ['type'],
          },
        },
      },
    },
    locales: {
      type: 'object',
      description: 'A set of translated strings for the section.',
      additionalProperties: {
        type: 'object',
        additionalProperties: {
          type: 'string',
        },
      },
    },
    enabled_on: {
      description: 'Restrict the section to certain template page types and section group types.',
      $ref: '#/definitions/sectionToggle',
    },
    disabled_on: {
      description:
        'Prevent the section from being used on certain template page types and section group types.',
      $ref: '#/definitions/sectionToggle',
    },
  },
});

const worker = self as any as Worker;

// The file tree is provided from the main thread as an array of strings.
// The default translations are provided from the main thread.
let files: Set<string>;
let defaultTranslations: any = {};
worker.addEventListener('message', (ev) => {
  const message = ev.data;
  if (!isDependencyInjectionMessage(message)) return;

  switch (message.method) {
    case 'shopify/setDefaultTranslations': {
      return (defaultTranslations = message.params);
    }
    case 'shopify/setFileTree': {
      return (files = new Set(message.params));
    }
  }
});

async function fileExists(path: string) {
  return files && files.has(path);
}

function getDefaultTranslationsFactory(_uri: string) {
  return async () => defaultTranslations as any;
}

// pretending they are the same :upside_down_smile:
function getDefaultSchemaTranslationsFactory(_uri: string) {
  return async () => defaultTranslations as any;
}

function getThemeSettingsSchemaForRootURI(_rootURI: URI) {
  return [] as any;
}

async function findRootURI(_uri: string) {
  return 'browser:/';
}

async function loadConfig(_uri: string) {
  return {
    settings: {},
    checks: allChecks,
    root: '/',
  };
}

startServer(worker, {
  fileSize: async (_: string) => 42,
  fileExists,
  findRootURI,
  getDefaultTranslationsFactory,
  getDefaultSchemaTranslationsFactory,
  getThemeSettingsSchemaForRootURI,
  getDefaultLocaleFactory: (_: string) => async () => 'en',
  getDefaultSchemaLocaleFactory: (_: string) => async () => 'en',
  themeDocset: {
    filters: async () => filters,
    tags: async () => tags,
    objects: async () => objects,
    systemTranslations: async () => systemTranslations,
  },
  jsonValidationSet: {
    schemas: {
      [`${baseURI}/schemas/section`]: {
        uri: `${baseURI}/schemas/section`,
        fileMatch: ['**/sections/*.liquid'],
        schema: Promise.resolve(sectionSchema),
      },
      [`${baseURI}/schemas/input_settings`]: {
        uri: `${baseURI}/schemas/input_settings`,
        schema: Promise.resolve(inputSettingsSchema),
      },
      [`${baseURI}/schemas/translations`]: {
        uri: `${baseURI}/schemas/translations`,
        fileMatch: ['**/locales/*.json'],
        schema: Promise.resolve(translationsSchema),
      },
    },
  },
  loadConfig,
  log(message) {
    console.info(message);
  },
});

export {};
