<template>
  <div>
    <div v-bind:class="{inactive: loading}">
      <h1 class="text-info">Nest Thermostat</h1>
      <p>Current Temperature: {{ambient_temperature_f}}</p>
      <p>System Running: {{hvac_state}}</p>
      <p>Target AC:
        <input type='text' v-model="highSetPoint" style="margin-left: 15px"/>
        <button class="btn btn-primary btn-sm" v-on:click="updateSetPointHigh()" style="margin-left: 15px">Update AC Set Point</button>
      </p>
      <p>Target Heat:
        <input type='text' v-model="lowSetPoint" style="margin-left: 15px"/>
        <button class="btn btn-danger btn-sm" v-on:click="updateSetPointLow()" style="margin-left: 15px;">Update Heat Set Point</button>
      </p>
      <button class="btn btn-success btn-md" v-on:click="getAllThermostat()">Get Status Update</button>
    </div>
    <double-bounce background="#197794" size="150px" v-if="loading" style="position: absolute; top: 100px; left: 200px;"></double-bounce>
  </div>
</template>

<script>
import Configuration from '../../app.config.js';
import NestService from '../services/nest.service.js';
import { DoubleBounce } from 'vue-loading-spinner';
const { ipcRenderer } = window.require("electron");
const Store = window.require('electron-store');
const store = new Store();

export default {
  name: 'NestThermostatMain',
  components: {
    DoubleBounce
  },
  data() {
    return {
      loading: false,
      nestResponse: { },
      lowSetPoint: undefined,
      highSetPoint: undefined,
      hvac_state: '--',
      ambient_temperature_f: '--',
      target_temperature_high_f: '--',
      target_temperature_low_f: '--',
      nestToken: ''
    };
  },
  created: function() {
    this.nestToken = store.get('NestToken');
    this.getAllThermostat();
  },
  methods: {
    getAllThermostat() {
      this.loading = true;
      NestService.getAll(this.nestToken).then(resp => {
        this.nestResponse = resp.data;
        this.hvac_state = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].hvac_state;
        this.ambient_temperature_f = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].ambient_temperature_f;
        this.target_temperature_high_f = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].target_temperature_high_f;
        this.target_temperature_low_f = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].target_temperature_low_f;
        this.lowSetPoint = this.target_temperature_low_f;
        this.highSetPoint = this.target_temperature_high_f;
        // Send message from renderer process to main process through channel vue
        ipcRenderer.send('update-tray-temp', `${this.ambient_temperature_f}℉`);
        this.loading = false;
      }).catch(e => console.log(e));
    },
    updateSetPointLow() {
      this.loading = true;
      NestService.updateSetPoint(this.nestToken, {
        target_temperature_low_f: Number(this.lowSetPoint)
      }).then(resp => {
        if(resp.status === 200) {
          this.getAllThermostat();
        }
      }).catch(e => console.log(e));
    },
    updateSetPointHigh() {
      this.loading = true;
      NestService.updateSetPoint(this.nestToken, {
        target_temperature_high_f: Number(this.highSetPoint)
      }).then(resp => {
        if(resp.status === 200) {
          this.getAllThermostat();
        }
      }).catch(e => console.log(e));
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  h1 {
    text-align: center;
  }

  .inactive {
    opacity: 0.5;
  }

  input {
    border: none;
    border-color: transparent;
    font-size: 25px;
  }

  input:focus {
    outline: none;
  }
  

</style>
