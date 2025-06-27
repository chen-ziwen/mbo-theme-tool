import { createApp } from 'vue';
import './style/global.scss';
import App from './App.vue';
import router from './router';
import 'ant-design-vue/dist/reset.css';

createApp(App).use(router).mount('#app');
