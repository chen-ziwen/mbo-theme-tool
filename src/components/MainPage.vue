<template>
    <div class="home-page">
        <div class="nav-tag">
            <NavBar></NavBar>
        </div>
        <div class="main-page">
            <RouterView v-slot="{ Component }">
                <KeepAlive>
                    <component :is="Component" :key="$route.name" v-if="$route.meta.keepAlive" />
                </KeepAlive>
                <component :is="Component" :key="$route.name" v-if="!$route.meta.keepAlive" />
            </RouterView>
        </div>
    </div>
</template>
<script lang='ts' setup>
import NavBar from './NavBar.vue';

</script>
<style lang='scss' scoped>
.home-page {
    width: 100%;
    height: 100%;
    display: flex;
    background: url(/assets/images/cat.jpg) no-repeat;
    background-size: 100% 100%;

    .nav-tag {
        flex: 1;
        height: 100%;
        background-color: rgba(70, 86, 99, 0.8);
    }

    .main-page {
        flex: 5;
        height: 100%;
    }
}
</style>