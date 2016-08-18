import _ from 'lodash';

import { MEMBER_NAME_REGEX } from './../config/constants';

export const noop = _.noop;
export const forEach = _.forEach;
export const extend = _.assign;
export const copy = _.cloneDeep;
export const isFunction = _.isFunction;

export function pass (value){ return value }

export function prettyError(){
  throw new Error(Array.prototype.join.call(arguments,' '));
}

export function isDefined(value) {
  return typeof value !== 'undefined';
}

// Helper functions and regex to lookup a dotted path on an object
// stopping at undefined/null.  The path must be composed of ASCII
// identifiers (just like $parse)
export function isValidDottedPath(path) {
  return (path != null && path !== '' && path !== 'hasOwnProperty' &&
  MEMBER_NAME_REGEX.test('.' + path));
}

export function lookupDottedPath(obj, path) {
  if (!isValidDottedPath(path)) {
    throw prettyError('badmember', 'Dotted member path "@{0}" is invalid.', path);
  }
  const keys = path.split('.');
  for (let i = 0, ii = keys.length; i < ii && isDefined(obj); i++) {
    let key = keys[i];
    obj = (obj !== null) ? obj[key] : undefined;
  }
  return obj;
}

/**
 * Create a shallow copy of an object and clear other fields from the destination
 */
export function shallowClearAndCopy(src, dst) {

  dst = dst || {};

  forEach(dst, (value, key) => {
    delete dst[key];
  });

  for (let key in src) {
    if (src.hasOwnProperty(key) && !(key.charAt(0) === '$' && key.charAt(1) === '$')) {
      dst[key] = src[key];
    }
  }

  return dst;
}

/**
 * We need our custom method because encodeURIComponent is too aggressive and doesn't follow
 * http://www.ietf.org/rfc/rfc3986.txt with regards to the character set
 * (pchar) allowed in path segments:
 *    segment       = *pchar
 *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
 *    pct-encoded   = "%" HEXDIG HEXDIG
 *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
 *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
 *                     / "*" / "+" / "," / ";" / "="
 */
export function encodeUriSegment(val) {
  return encodeUriQuery(val, true).
  replace(/%26/gi, '&').
  replace(/%3D/gi, '=').
  replace(/%2B/gi, '+');
}

/**
 * This method is intended for encoding *key* or *value* parts of query component. We need a
 * custom method because encodeURIComponent is too aggressive and encodes stuff that doesn't
 * have to be encoded per http://tools.ietf.org/html/rfc3986:
 *    query       = *( pchar / "/" / "?" )
 *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
 *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
 *    pct-encoded   = "%" HEXDIG HEXDIG
 *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
 *                     / "*" / "+" / "," / ";" / "="
 */
export function encodeUriQuery(val, pctEncodeSpaces) {
  return encodeURIComponent(val).
  replace(/%40/gi, '@').
  replace(/%3A/gi, ':').
  replace(/%24/g, '$').
  replace(/%2C/gi, ',').
  replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
}

export function extractParams(data, actionParams, paramDefaults) {
  const ids = {};
  actionParams = extend({}, paramDefaults, actionParams);
  forEach(actionParams, (value, key) => {
    if (isFunction(value)) { value = value(); }
    ids[key] = value && value.charAt && value.charAt(0) == '@' ?
      lookupDottedPath(data, value.substr(1)) : value;
  });
  return ids;
}

export function defaultResponseInterceptor(response) {
  return response.resource;
}
