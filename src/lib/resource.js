import _ from 'lodash';
import HTTP from './http';

import {
  noop,
  forEach,
  extend,
  copy,
  isFunction,
  prettyError,
  isDefined,
  isValidDottedPath,
  lookupDottedPath,
  shallowClearAndCopy,
  encodeUriSegment,
  encodeUriQuery,
  extractParams,
  defaultResponseInterceptor
} from './util';

import { DEFAULTS } from './../config/constants';

import Route from './route';

export default function () {

  function resourceFactory(url, paramDefaults, actions, options) {
    const route = new Route(url, options);

    actions = extend({}, DEFAULTS.actions, actions);

    function Resource(value) {
      shallowClearAndCopy(value || {}, this);
    }

    Resource.prototype.toJSON = function() {
      const data = extend({}, this);
      delete data.promise;
      delete data.resolved;
      return data;
    };

    forEach(actions, (action, name) => {
      var hasBody = /^(POST|PUT|PATCH)$/i.test(action.method);

      Resource[name] = (a1, a2, a3, a4) => {
        var params = {}, data, success, error, http;
        http = HTTP.getInstance();

        /* jshint -W086 */ /* (purposefully fall through case statements) */
        switch (arguments.length) {
          case 4:
            error = a4;
            success = a3;
          //fallthrough
          case 3:
          case 2:
            if (isFunction(a2)) {
              if (isFunction(a1)) {
                success = a1;
                error = a2;
                break;
              }

              success = a2;
              error = a3;
              //fallthrough
            } else {
              params = a1;
              data = a2;
              success = a3;
              break;
            }
          case 1:
            if (isFunction(a1)) success = a1;
            else if (hasBody) data = a1;
            else params = a1;
            break;
          case 0: break;
          default:
            throw prettyError('badargs',
              "Expected up to 4 arguments [params, data, success, error], got {0} arguments",
              arguments.length);
        }
        /* jshint +W086 */ /* (purposefully fall through case statements) */


        var isInstanceCall = this instanceof Resource;
        var value = isInstanceCall ? data : (action.isArray ? [] : new Resource(data));
        var httpConfig = {};
        var responseInterceptor = action.interceptor && action.interceptor.response ||
          defaultResponseInterceptor;
        var responseErrorInterceptor = action.interceptor && action.interceptor.responseError ||
          undefined;

        forEach(action, function(value, key) {
          switch (key) {
            default:
              httpConfig[key] = copy(value);
              break;
            case 'params':
            case 'isArray':
            case 'interceptor':
              break;
          }
        });

        if (hasBody) {
          httpConfig.data = data;
        }
        route.setUrlParams(httpConfig,
          extend({}, extractParams(data, action.params || {}, paramDefaults), params),
          action.url);
        let promise = http(httpConfig).then(function(response) {
          var data = response.data;

          if (data) {
            // Need to convert action.isArray to boolean in case it is undefined
            // jshint -W018
            if (_.isArray(data) !== (!!action.isArray)) {
              throw prettyError('badcfg',
                'Error in resource configuration for action `{0}`. Expected response to ' +
                'contain an {1} but got an {2} (Request: {3} {4})', name, action.isArray ? 'array' : 'object',
                _.isArray(data) ? 'array' : 'object', httpConfig.method, httpConfig.url);
            }
            // jshint +W018
            if (action.isArray) {
              value.length = 0;
              forEach(data, function(item) {
                if (typeof item === "object") {
                  value.push(new Resource(item));
                } else {
                  // Valid JSON values may be string literals, and these should not be converted
                  // into objects. These items will not have access to the Resource prototype
                  // methods, but unfortunately there
                  value.push(item);
                }
              });
            } else {
              var promise = value.promise;     // Save the promise
              shallowClearAndCopy(data, value);
              value.promise = promise;         // Restore the promise
            }
          }
          response.resource = value;

          value = responseInterceptor(response);
          (success || noop)(value, response.headers);
          return value;
        }, (response)=> {
          (error || noop)(response);
          (responseErrorInterceptor || noop)(response);
          return Promise.reject(response);
        });

        if (!isInstanceCall) {
          // we are creating instance / collection
          // - set the initial promise
          // - return the instance / collection
          value.promise = promise;
          value.resolved = false;

          return value;
        }

        // instance call
        return promise;
      };


      Resource.prototype['$' + name] = function(params, success, error) {
        if (isFunction(params)) {
          error = success; success = params; params = {};
        }
        const result = Resource[name].call(this, params, this, success, error);
        return result.promise || result;
      };
    });

    Resource.bind = (additionalParamDefaults) => {
      return resourceFactory(url, extend({}, paramDefaults, additionalParamDefaults), actions);
    };

    return Resource;
  }

  return resourceFactory.apply(this, arguments);
};
