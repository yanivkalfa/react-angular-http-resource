export const DEFAULTS = {
  // Strip slashes by default
  stripTrailingSlashes: true,

  // Default actions configuration
  actions: {
    'get': { method: 'GET' },
    'save': { method: 'POST' },
    'query': { method: 'GET', isArray: true },
    'remove': {method: 'DELETE'},
    'delete': {method: 'DELETE'}
  }
};

export const MEMBER_NAME_REGEX = /^(\.[a-zA-Z_$][0-9a-zA-Z_$]*)+$/;
export const PROTOCOL_AND_DOMAIN_REGEX = /^https?:\/\/[^\/]*/;
