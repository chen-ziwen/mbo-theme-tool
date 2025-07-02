<template>
    <div class="section-header">
        <h3>{{ title }}</h3>
        <a-button type="primary" @click="onAdd">{{ buttonText }}</a-button>
    </div>
</template>

<script setup lang="ts">
interface SectionHeaderProps {
    title: string;
    buttonText?: string;
}

withDefaults(defineProps<SectionHeaderProps>(), {
    buttonText: '添加'
});

const emit = defineEmits<{
    (e: 'add'): void
}>();

const onAdd = () => emit('add');
</script>

<style scoped lang="scss">
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e8f4fd;

    h3 {
        @include icon-title;
    }

    :deep(.ant-btn) {
        @include ant-btn;
    }
}
</style>