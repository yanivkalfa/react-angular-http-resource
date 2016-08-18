import _ from 'lodash';
import { pass } from './util';
import axios from 'axios';

let options = {
  defaults:{}
};

let initInterceptors = {
  request: null,
  response: null
};

function HTTP(ignoreOptions) {
  return HTTP.getInstance(ignoreOptions);
}

HTTP.setOptions = function (extendedDefaults) {
  Object.assign(options, extendedDefaults);
  Object.assign(axios.defaults, options.defaults);

  if (options.interceptors) {
    let interceptors = options.interceptors;
    if(interceptors.requestSuccess || interceptors.requestError) {
      let request = [];
      request.push(interceptors.requestSuccess || pass);
      request.push(interceptors.requestError || pass);

      if ( initInterceptors.request ) {
        axios.interceptors.request.eject(initInterceptors.request);
        initInterceptors.request = null;
      }

      if ( request.length ) {
        initInterceptors.request = axios.interceptors.request.use.apply(axios.interceptors.request, request);
      }
    }

    if(interceptors.responseSuccess || interceptors.responseError) {
      let response = [];
      response.push(interceptors.responseSuccess || pass);
      response.push(interceptors.responseError || pass);

      if ( initInterceptors.response ) {
        axios.interceptors.response.eject(initInterceptors.response);
        initInterceptors.response = null;
      }

      if ( response.length ) {
        initInterceptors.response = axios.interceptors.response.use.apply(axios.interceptors.response, response);
      }
    }
  }
};

HTTP.getOptions = function() {
  return options;
};

HTTP.getInstance = function(ignoreOptions) {
  return axios;
};

export default HTTP;
