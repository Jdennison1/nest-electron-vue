<template>
  <div v-bind:class="{inactive: loading, cooling: hvac_state === 'cooling', heating: hvac_state === 'heating'}">
    <p style="font-size: 46px; text-align: center;">{{ambient_temperature_f}}℉</p>
    <div class=row>
      <div class="col-6" style="text-align: center;">
        <input type='text' v-model="lowSetPoint" style="color: #FF8247" v-bind:class="{cooling: hvac_state === 'cooling', heating: hvac_state === 'heating'}"/>
      </div>
      <div class="col-6" style="text-align: center;">
        <input type='text' v-model="highSetPoint" style="color: #0BB5FF" v-bind:class="{cooling: hvac_state === 'cooling', heating: hvac_state === 'heating'}"/>
      </div>
    </div>
    <button class="btn btn-success btn-md" style="width: 100%; margin-top: 5px;" v-on:click="sendUpdate()">Update</button>
    <cube-shadow v-if="loading" background="#5CB85C" style="position: absolute; top: 70px; left: 144px;"></cube-shadow>
  </div>
</template>

<script>
import Configuration from '../../app.config.js';
import NestService from '../services/nest.service.js';
import { CubeShadow } from 'vue-loading-spinner';
import Cron from 'node-cron';
const { ipcRenderer } = window.require("electron");
const Store = window.require('electron-store');
const store = new Store();

export default {
  name: 'NestThermostatMain',
  components: {
    CubeShadow
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
    ipcRenderer.send('electron-window-size', 350, 170);
    this.nestToken = store.get('NestToken');
    this.getAllThermostat();
    const updateTask = Cron.schedule('*/15 * * * *', () => this.getAllThermostat(false));
    updateTask.start();
  },
  methods: {
    getAllThermostat(setloading = true) {
      this.loading = setloading;
      NestService.getAll(this.nestToken).then(resp => {
        this.nestResponse = resp.data;
        this.hvac_state = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].hvac_state;
        this.ambient_temperature_f = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].ambient_temperature_f;
        this.target_temperature_high_f = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].target_temperature_high_f;
        this.target_temperature_low_f = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].target_temperature_low_f;
        this.lowSetPoint = this.target_temperature_low_f;
        this.highSetPoint = this.target_temperature_high_f;
        // Send message from renderer process to main process through channel vue
        let hvac_symbol = ''
        switch(this.hvac_state) {
          case 'heating':
            hvac_symbol = '☼';
            break;
          case 'cooling':
            hvac_symol = '❄︎';
            break;
          default:
            hvac_symbol = '✓';
            break;
        }
        ipcRenderer.send('update-tray-temp', `${hvac_symbol}${this.ambient_temperature_f}℉`);
        this.loading = false;
      }).catch(e => console.log(e));
    },
    sendUpdate() {
      //TODO: Error handling
      this.loading = true;
      const self = this;
      NestService.updateSetPoint(this.nestToken, {
        target_temperature_high_f: Number(this.highSetPoint),
        target_temperature_low_f: Number(this.lowSetPoint)
      }).then(resp => {
        if(resp.status === 200) {
          this.loading = false;
          setTimeout(function() { self.getAllThermostat(false) }, 5000);
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

  .heating {
    background-color: #FFE1C7;
  }

  .cooling {
    background-color: #C7E7FF;
  }

  input {
    border: none;
    border-color: transparent;
    font-size: 30px;
    font-weight: 600;
    width: 70px;
  }

  input:focus {
    outline: none;
  }
</style>
