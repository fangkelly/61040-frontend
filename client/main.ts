import "@/assets/main.css";
import "purecss";

import "@mdi/font/css/materialdesignicons.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import VueMapboxTs from "vue-mapbox-ts";

import { createPinia } from "pinia";
import piniaPluginPersistedState from "pinia-plugin-persistedstate";
import { VDatePicker } from "vuetify/labs/VDatePicker";

import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";

import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";

const vuetify = createVuetify({
  components: { ...components, VDatePicker },
  directives,
});

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedState);

app.use(pinia);
app.use(router);

app.use(vuetify);
app.use(VueMapboxTs);

app.mount("#app");
