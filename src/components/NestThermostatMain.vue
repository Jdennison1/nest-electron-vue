<template>
  <div>
    <div v-bind:class="{inactive: loading, cooling: hvac_state === 'cooling', heating: hvac_state === 'heating'}">
      <p style="position: absolute; top: 0; left: 3px; font-size: 14px;">{{thermostatLocation}}: {{ambient_temperature_f}}℉ | {{humidity}}%</p>
      <img v-if="leaf" style="position: absolute; top: 22px; left: 3px;" src="../assets/leafIcon16.png"/>
      
      <div class="dropdown top-dropdown">
        <button style="position: absolute; top: 3px; right: 3px;" class="btn btn-secondary btn-sm dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Mode: {{hvac_mode | capitalize}}
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <a class="dropdown-item" @click="onHvacModeChange('heat')">Heat</a>
          <a class="dropdown-item" @click="onHvacModeChange('cool')">Cool</a>
          <a class="dropdown-item" @click="onHvacModeChange('heat-cool')">Heat/Cool</a>
        </div>
      </div>

      <!--HVAC HEAT & COOL MODE-->
      <div v-if="hvac_mode === 'heat-cool'" class="row mx-0">
        <div class="col-6 px-0">
          <input type='text' v-model="lowSetPoint" style="color: #FF8247" v-bind:class="{cooling: hvac_state === 'cooling', heating: hvac_state === 'heating'}"/>
        </div>
        <div class="col-6 px-0">
          <input type='text' v-model="highSetPoint" style="color: #0BB5FF" v-bind:class="{cooling: hvac_state === 'cooling', heating: hvac_state === 'heating'}"/>
        </div>
      </div>

      <!--HVAC HEAT MODE-->
      <div v-if="hvac_mode === 'heat'" class="row mx-0">
        <div class="col-12 px-0">
          <input type='text' v-model="targetSetPoint" style="color: #FF8247" v-bind:class="{heating: hvac_state === 'heating'}"/>
        </div>
      </div>

      <!--HVAC COOL MODE-->
      <div v-if="hvac_mode === 'cool'" class="row mx-0">
        <div class="col-12 px-0">
          <input type='text' v-model="targetSetPoint" style="color: #0BB5FF" v-bind:class="{cooling: hvac_state === 'cooling'}"/>
        </div>
      </div>
      <div v-if="timeToTarget !== '~0'" style="position: absolute; top: 84px; left: 124px; color: #888">in {{timeToTarget}} minutes</div>
      <button class="btn btn-success btn-md" style="position: absolute; bottom: 0; width: 100%; margin-top: 5px; border-radius: 0px !important;" v-on:click="sendUpdate()">Update Thermostat Setpoint</button>
    </div>
    <cube-shadow v-if="loading" background="#5CB85C" style="position: absolute; top: 70px; left: 154px;"></cube-shadow>
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
      targetSetPoint: undefined,
      timeToTarget: '~0',
      hvac_state: '--',
      ambient_temperature_f: '--',
      target_temperature_high_f: '--',
      target_temperature_low_f: '--',
      humidity: '--',
      thermostatLocation: '--',
      hvac_mode: '--',
      nestToken: '',
      leaf: false
    };
  },
  created: function() {
    ipcRenderer.send('electron-window-size', 350, 143);
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
        this.thermostatLocation = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].where_name;
        this.ambient_temperature_f = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].ambient_temperature_f;
        this.target_temperature_high_f = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].target_temperature_high_f;
        this.target_temperature_low_f = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].target_temperature_low_f;
        this.hvac_mode = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].hvac_mode;
        this.lowSetPoint = this.target_temperature_low_f;
        this.highSetPoint = this.target_temperature_high_f;
        this.targetSetPoint = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].target_temperature_f;
        this.humidity = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].humidity;
        this.leaf = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].has_leaf;
        this.timeToTarget = this.nestResponse.devices.thermostats[Configuration.NestThermostatId].time_to_target;
        
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
      let req = { };

      switch(this.hvac_mode) {
        case 'heat':
          req = { target_temperature_f: Number(this.targetSetPoint) };
          break;
        case 'cool':
          req = { target_temperature_f: Number(this.targetSetPoint) };
          break;
        case 'heat-cool':
          req = {
            target_temperature_high_f: Number(this.highSetPoint),
            target_temperature_low_f: Number(this.lowSetPoint)
          };
          break;
        default:
          // should never get here
          console.error('unexpected hvac_mode when sending setpoint update');
          return;
      }

      NestService.updateSetPoint(this.nestToken, req).then(resp => {
        if(resp.status === 200) {
          this.loading = false;
          setTimeout(function() { self.getAllThermostat(false) }, 5000);
        }
      }).catch(e => console.log(e));
    },
    onHvacModeChange(mode) {
      this.loading = true;
      const self = this;
      this.hvac_mode = mode;
      NestService.updateHvacMode(this.nestToken, this.hvac_mode).then(resp => {
        if(resp.status === 200) {
          this.loading = false;
          setTimeout(function() { self.getAllThermostat(false) }, 5000);
        }
      }).catch(e => console.log(e));
    }
  },
  filters: {
    capitalize: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
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

  .top-dropdown {
    z-index: 1000;
  }

  input {
    border: none;
    border-color: transparent;
    font-size: 50px;
    font-weight: 600;
    width: 100%;
    text-align: center;
    background: transparent;
    margin-top: 28px;
  }

  select {
    z-index: 1000;
  }

  input:focus {
    outline: none;
  }
</style>
