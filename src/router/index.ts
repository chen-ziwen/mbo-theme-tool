import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import MainRouter from './routes';

const routes: Array<RouteRecordRaw> = [
    MainRouter,
]

export default createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes
})