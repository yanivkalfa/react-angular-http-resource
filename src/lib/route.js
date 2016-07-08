import {
  forEach,
  extend,
  prettyError,
  isDefined,
  encodeUriSegment,
  encodeUriQuery
} from './util';


import { MEMBER_NAME_REGEX, DEFAULTS, PROTOCOL_AND_DOMAIN_REGEX } from './../config/constants';

class Route {
  constructor(template, defaults) {
    this.template = template;
    this.defaults = extend({}, DEFAULTS, defaults);
    this.urlParams = {};
  }


  setUrlParams (config, params, actionUrl) {

    let self = this,
      url = actionUrl || self.template,
      val,
      encodedVal,
      protocolAndDomain = '';

    const urlParams = self.urlParams = {};
    forEach(url.split(/\W/), (param) => {
      if (param === 'hasOwnProperty') {
        throw prettyError('badname', "hasOwnProperty is not a valid parameter name.");
      }
      if (!(new RegExp("^\\d+$").test(param)) && param &&
        (new RegExp("(^|[^\\\\]):" + param + "(\\W|$)").test(url))) {
        urlParams[param] = {
          isQueryParamValue: (new RegExp("\\?.*=:" + param + "(?:\\W|$)")).test(url)
        };
      }
    });
    url = url.replace(/\\:/g, ':');
    url = url.replace(PROTOCOL_AND_DOMAIN_REGEX, (match) => {
      protocolAndDomain = match;
      return '';
    });

    params = params || {};
    forEach(self.urlParams, (paramInfo, urlParam) => {
      val = params.hasOwnProperty(urlParam) ? params[urlParam] : self.defaults[urlParam];
      if (isDefined(val) && val !== null) {
        if (paramInfo.isQueryParamValue) {
          encodedVal = encodeUriQuery(val, true);
        } else {
          encodedVal = encodeUriSegment(val);
        }
        url = url.replace(new RegExp(":" + urlParam + "(\\W|$)", "g"), (match, p1) => {
          return encodedVal + p1;
        });
      } else {
        url = url.replace(new RegExp("(\/?):" + urlParam + "(\\W|$)", "g"), (match, leadingSlashes, tail) => {
          if (tail.charAt(0) === '/') {
            return tail;
          } else {
            return leadingSlashes + tail;
          }
        });
      }
    });

    // strip trailing slashes and set the url (unless this behavior is specifically disabled)
    if (self.defaults.stripTrailingSlashes) {
      url = url.replace(/\/+$/, '') || '/';
    }

    // then replace collapse `/.` if found in the last URL path segment before the query
    // E.g. `http://url.com/id./format?q=x` becomes `http://url.com/id.format?q=x`
    url = url.replace(/\/\.(?=\w+($|\?))/, '.');
    // replace escaped `/\.` with `/.`
    config.url = protocolAndDomain + url.replace(/\/\\\./, '/.');


    // set params - delegate param encoding to $http
    forEach(params, (value, key) => {
      if (!self.urlParams[key]) {
        config.params = config.params || {};
        config.params[key] = value;
      }
    });
  }
}

export default Route;