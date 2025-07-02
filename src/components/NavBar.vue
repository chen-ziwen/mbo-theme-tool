<template>
    <nav class="nav">
        <template v-for="item in navLink" :key="item.path">
            <RouterLink :to="{ name: item.path }" active-class="active">{{ item.name }}</RouterLink>
        </template>
    </nav>
</template>

<script lang='ts' setup>
const navLink = [
    { name: "文件处理", path: 'file-reslove' },
    { name: "配置管理", path: 'config-manager' },
    { name: "使用说明", path: 'tips' },
    { name: "应用更新", path: 'update-manager' }
];
</script>
<style lang='scss' scoped>
.nav {
    height: 100%;

    a {
        width: 100%;
        height: 50px;
        line-height: 50px;
        display: inline-block;
        padding: 0 20px;
        box-sizing: border-box;
        color: #fff;
    }

    .active {
        background-color: rgba(40, 58, 78, 0.8);
    }
}
</style>