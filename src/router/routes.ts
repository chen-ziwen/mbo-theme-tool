import MainPage from '@/view/MainPage.vue';

export default {
    path: '/',
    name: 'main-page',
    redirect: { name: 'file-reslove' },
    meta: {
        title: '主页',
    },
    component: MainPage,
    children: [
        {
            path: 'file-reslove',
            name: 'file-reslove',
            meta: {
                title: '文件处理',
                keepAlive: true
            },
            component: () => import("@/view/FileReslove.vue"),
        },
        {
            path: 'config-manager',
            name: 'config-manager',
            meta: {
                title: '配置管理',
                keepAlive: true
            },
            component: () => import("@/view/ConfigManager.vue"),
        },
        {
            path: 'tips',
            name: 'tips',
            meta: {
                title: '使用说明'
            },
            component: () => import("@/view/Tips.vue"),
        },
        {
            path: 'update-manager',
            name: 'update-manager',
            meta: {
                title: '应用更新',
                keepAlive: true
            },
            component: () => import("@/view/UpdateManager.vue"),
        }
    ]
};