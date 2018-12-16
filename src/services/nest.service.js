import Axios from 'axios';
import Configuration from '../../app.config.js';
const qs = require('querystring');

const axios = Axios.create({
  baseURL: 'https://developer-api.nest.com',
  timeout: 15000
});

export default {
  getToken: (code) => {
    
    const requestBody = qs.stringify({
      client_id: Configuration.NestClientId,
      client_secret: Configuration.NestClientSecret,
      grant_type:'authorization_code',
      code: code
    });

    const requestConfig = {
      baseURL: 'https://api.home.nest.com',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    return axios.post('/oauth2/access_token', requestBody, requestConfig);
  },
  getAll: (token) => {
    return axios.get('/', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `application/json`
      }
    });
  },
  updateSetPoint: (token, data) => {
    return axios.put(`/devices/thermostats/${Configuration.NestThermostatId}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `application/json`
      }
    });
  },
  updateHvacMode: (token, mode) => {
    return axios.put(`/devices/thermostats/${Configuration.NestThermostatId}`, {hvac_mode: String(mode)}, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `application/json`
      }
    });
  }
};