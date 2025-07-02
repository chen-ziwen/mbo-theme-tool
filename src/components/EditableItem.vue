<template>
    <div class="editable-item">
        <div class="item-wrapper">
            <a-input-group class="input-button-group">
                <template v-if="type === 'path'">
                    <a-input v-model:value="localItem.name" placeholder="文件名" :class="{ 'input-with-edit': isEditing }"
                        :style="isEditing ? 'width: 25%' : 'width: 30%'" :disabled="!isEditing" />
                    <a-input v-model:value="localItem.path" placeholder="文件路径" :class="{ 'input-with-edit': isEditing }"
                        :style="isEditing ? 'width: 40%' : 'width: 50%'" :disabled="!isEditing" />
                </template>
                <template v-else>
                    <a-input v-model:value="localValue" placeholder="文件夹路径" :class="{ 'input-with-edit': isEditing }"
                        :style="isEditing ? 'width: 65%' : 'width: 80%'" :disabled="!isEditing" />
                </template>
                <a-button-group :style="buttonGroupStyle">
                    <a-button ghost v-if="!isEditing" @click="$emit('update:isEditing', true)">编辑</a-button>
                    <a-button ghost v-if="isEditing" @click="saveChanges" type="primary">完成</a-button>
                    <a-button ghost v-if="isEditing" @click="cancelChanges">取消</a-button>
                    <a-button danger @click="confirmDelete">删除</a-button>
                </a-button-group>
            </a-input-group>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Modal } from 'ant-design-vue';

interface PathItem {
    name: string;
    path: string;
}

interface EditableItemProps {
    type: 'path' | 'folder';
    item: PathItem | string;
    isEditing: boolean;
}

const props = defineProps<EditableItemProps>();
const emit = defineEmits(['update:isEditing', 'update:item', 'finish', 'cancel', 'delete']);

const localItem = ref<PathItem>(props.type === 'path' ? { ...props.item as PathItem } : { name: '', path: '' });
const localValue = ref<string>(props.type === 'folder' ? props.item as string : '');

const buttonGroupStyle = computed(() => props.isEditing ? 'width: 35%' : 'width: 20%');

watch(() => props.item, (newVal) => {
    if (props.type === 'path') {
        localItem.value = { ...(newVal as PathItem) };
    } else {
        localValue.value = newVal as string;
    }
}, { deep: true });

watch(() => props.isEditing, (newVal) => {
    if (newVal) {
        if (props.type === 'path') {
            localItem.value = { ...(props.item as PathItem) };
        } else {
            localValue.value = props.item as string;
        }
    }
}, { immediate: true });


const saveChanges = () => {
    if (props.type === 'path') {
        emit('update:item', localItem.value);
    } else {
        emit('update:item', localValue.value);
    }
    emit('finish');
    emit('update:isEditing', false);
};

const cancelChanges = () => {
    emit('cancel');
    emit('update:isEditing', false);
};

const confirmDelete = () => {
    const itemName = props.type === 'path'
        ? (props.item as PathItem).name || '此路径'
        : props.item || '此文件夹';

    Modal.confirm({
        title: '确认删除',
        content: `确定要删除${props.type === 'path' ? '路径' : '文件夹'} "${itemName}" 吗？此操作不可撤销。`,
        okText: '确定',
        cancelText: '取消',
        onOk() {
            emit('delete');
        }
    });
};
</script>

<style scoped lang="scss">
.editable-item {
    margin-bottom: 12px;

    .item-wrapper {
        @include list-item;
        padding: 16px;
        transition: $transition;

        &:hover {
            border-color: #1890ff;
            box-shadow: $box-shadow-hover;
        }
    }

    :deep(.ant-input-group) {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 8px;

        &.input-button-group {
            transition: $transition;
        }

        .ant-input {
            transition: width 0.3s ease;
            @include input-style;

            &.input-with-edit {
                border-color: #1890ff;
            }
        }

        .ant-btn-group {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 5px;
            transition: $transition;
            margin-left: 6px;
        }
    }

    :deep(.ant-btn) {
        flex: 1;
        min-width: 0;
        @include ant-btn;
    }
}
</style>