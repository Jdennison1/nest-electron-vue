<template>
  <div>
    <h1 class="text-info">Nest Authorization</h1>
    <p>Follow the link below to obtain an authorization code from your Nest account for this application. Enter the provided code in the <i>Code</i> field below and press authorize.</p>
    <button class="btn btn-default btn-sm" style="background-color: #ccc" v-on:click="openAuthPage()">Get Nest Authorization Code</button>
    <br/>
    <br/>
    <p>Code:
      <input type='text' v-model="authCode" style="margin-left: 15px" />
    </p>
    <button class="btn btn-success btn-md" v-on:click="authorizeNest()">Authorize This App</button>
  </div>
</template>

<script>
import NestService from '../services/nest.service.js';
const { shell } = window.require('electron');
const configuration = require('../../app.config.js');
const Store = window.require('electron-store');

const store = new Store();

export default {
  name: 'NestAuthorization',
  data() {
    return {
      authCode: ''
    };
  },
  created: function() {
    // TODO: Make this smarter and check the expiry
    if(store.has('NestToken')) {
      this.$router.push('thermostat');
    }
  },
  methods: {
    authorizeNest() {
      NestService.getToken(this.authCode).then(resp => {
        store.set('NestToken', resp.data.access_token);
        this.$router.push('thermostat');
      });
    },
    openAuthPage() {
      shell.openExternal(configuration.NestAuthorizationUrl);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  div {
    text-align: center;
  }
</style>
