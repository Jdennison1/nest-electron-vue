import Axios from 'axios';
const configuration = require('../../app.config.js');

const axios = Axios.create({
  baseURL: 'https://developer-api.nest.com',
  timeout: 5000
});

export default {
  getToken: (code) => {
    return axios.get('/oauth2/access_token', {
      baseURL: 'https://api.home.nest.com',
      headers: {
        'client_id': configuration.NestClientId,
        'client_secret': configuration.NestClientSecret,
        'grant_type':'authorization_code',
        'code': code
      }
    });
  },
  getAll: () => {
    return axios.get('/', {
      headers: {
        Authorization: `Bearer ${configuration.NestBearerToken}`,
        'Content-Type': `application/json`
      }
    });
  },
  updateSetPoint: (data) => {
    return axios.put(`/devices/thermostats/${configuration.NestThermostatId}`, data, {
      headers: {
        Authorization: `Bearer ${configuration.NestBearerToken}`,
        'Content-Type': `application/json`
      }
    });
  }
};