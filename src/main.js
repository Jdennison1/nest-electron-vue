import Vue from 'vue';
import VueRouter from 'vue-router';
import App from './App.vue';
import NestThermostatMain from './components/NestThermostatMain.vue';
import NestAuthorization from './components/NestAuthorization.vue';

Vue.use(VueRouter);
Vue.config.productionTip = false;

const routes = [
  { path: '/', component: NestAuthorization },
  { path: '/thermostat', component: NestThermostatMain }
];

const router = new VueRouter({
  routes
});

new Vue({
  render: h => h(App),
  router
}).$mount('#app');
