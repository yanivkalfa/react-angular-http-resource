import _ from 'lodash';
import { pass } from './util';
import axios from 'axios';

let options = {
  defaults:{}
};

function HTTP(ignoreOptions){
  return HTTP.getInstance(ignoreOptions);
}

HTTP.setOptions = function (extendedDefaults) {
  options = Object.assign(options, extendedDefaults);
};

HTTP.getOptions = function() {
  return options;
};

HTTP.getInstance = function(ignoreOptions) {
  
  if (ignoreOptions) return axios;
  
  Object.assign(axios.defaults, options.defaults);

  if (options.interceptors) {
    let interceptors = options.interceptors;
    if(interceptors.requestSuccess || interceptors.requestError){
      let request = [];
      request.push(interceptors.requestSuccess || pass);
      request.push(interceptors.requestError || pass);

      if ( request.length ) {
        axios.interceptors.request.use.apply(axios.interceptors.request, request);
      }
    }

    if(interceptors.responseSuccess || interceptors.responseError){
      let response = [];
      response.push(interceptors.responseSuccess || pass);
      response.push(interceptors.responseError || pass);

      if ( response.length ) {
        axios.interceptors.response.use.apply(axios.interceptors.response, response);
      }
    }
  }

  return axios;
};



export default HTTP;