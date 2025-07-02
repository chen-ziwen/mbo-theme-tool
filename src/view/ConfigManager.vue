<template>
    <div class="config-manager">
        <div class="config-content">
            <a-tabs v-model:activeKey="activeTab" type="card">
                <a-tab-pane key="paths" tab="文件路径配置">
                    <div class="config-section">
                        <section-header title="必需文件路径" buttonText="添加路径" @add="addNecessaryPath" />
                        <div class="item-list">
                            <editable-item v-for="(item, key) in filePaths.necessary" :key="key" type="path"
                                :item="item" :is-editing="!!editingPaths.necessary[key]"
                                @update:is-editing="(val) => updateEditingState('necessary', key, val)"
                                @update:item="(val) => filePaths.necessary[key] = val"
                                @finish="finishEditNecessaryPath(key)" @cancel="cancelEditNecessaryPath(key)"
                                @delete="deleteNecessaryPath(key)" />
                        </div>
                        <section-header title="可选文件路径" buttonText="添加路径" @add="addOptionalPath"
                            style="margin-top: 30px;" />
                        <div class="item-list">
                            <editable-item v-for="(item, key) in filePaths.optional" :key="key" type="path" :item="item"
                                :is-editing="!!editingPaths.optional[key]"
                                @update:is-editing="(val) => updateEditingState('optional', key, val)"
                                @update:item="(val) => filePaths.optional[key] = val"
                                @finish="finishEditOptionalPath(key)" @cancel="cancelEditOptionalPath(key)"
                                @delete="deleteOptionalPath(key)" />
                        </div>
                    </div>
                </a-tab-pane>
                <a-tab-pane key="folders" tab="额外文件夹配置">
                    <div class="config-section">
                        <section-header title="额外文件夹列表" buttonText="添加文件夹" @add="addExtraFolder" />
                        <div class="item-list">
                            <editable-item v-for="(folder, index) in extraFolders" :key="index" type="folder"
                                :item="folder" :is-editing="!!editingFolder[index]"
                                @update:is-editing="(val) => updateEditingFolderState(index, val)"
                                @update:item="(val) => extraFolders[index] = val" @finish="finishEditFolder(index)"
                                @cancel="cancelEditFolder(index)" @delete="deleteFolder(index)" />
                        </div>
                    </div>
                </a-tab-pane>
            </a-tabs>
        </div>
        <div class="config-actions">
            <a-space>
                <a-button type="primary" size="large" @click="saveAllConfigs" :loading="saving">保存配置</a-button>
                <a-button size="large" ghost @click="backup" :loading="backing">备份配置</a-button>
                <a-button size="large" ghost @click="load" :loading="loading">重新加载</a-button>
                <a-button size="large" danger @click="reset" :loading="resetting">重置配置</a-button>
            </a-space>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import EditableItem from '../components/EditableItem.vue';
import SectionHeader from '../components/SectionHeader.vue';

interface PathItem {
    name: string;
    path: string;
};

const loadAPI = window.mt.config.load;
const saveAPI = window.mt.config.save;
const backupAPI = window.mt.config.backup;
const resetAPI = window.mt.config.reset;

const activeTab = ref('paths');
const loading = ref(false);
const saving = ref(false);
const backing = ref(false);
const resetting = ref(false);

const filePaths = reactive<{
    necessary: Record<string, PathItem>;
    optional: Record<string, PathItem>;
}>({
    necessary: {},
    optional: {}
});

const editingPaths = reactive<{
    necessary: Record<string, boolean>;
    optional: Record<string, boolean>;
}>({
    necessary: {},
    optional: {}
});

const originalPaths = reactive<{
    necessary: Record<string, PathItem>;
    optional: Record<string, PathItem>;
}>({
    necessary: {},
    optional: {}
});

const extraFolders = reactive<string[]>([]);
const editingFolder = reactive<Record<string, boolean>>({});
const originalFolders = reactive<string[]>([]);

const load = async () => {
    loading.value = true;
    try {
        const configs = await loadAPI();

        filePaths.necessary = {};
        filePaths.optional = {};
        extraFolders.splice(0);

        if (configs.necessary) {
            Object.entries(configs.necessary).forEach(([key, path]) => {
                filePaths.necessary[key] = { name: key, path: path as string };
            });
        }
        if (configs.optional) {
            Object.entries(configs.optional).forEach(([key, path]) => {
                filePaths.optional[key] = { name: key, path: path as string };
            });
        }
        if (configs.extraFolders) {
            extraFolders.push(...configs.extraFolders);
        }

        originalPaths.necessary = {};
        originalPaths.optional = {};
        originalFolders.splice(0, originalFolders.length, ...configs.extraFolders);

        message.success('配置加载成功');
    } catch (error) {
        message.error('配置加载失败');
        console.error(error);
    } finally {
        loading.value = false;
    }
};

const backup = async () => {
    backing.value = true;
    try {
        const result = await backupAPI();
        if (result.success) {
            message.success(`配置备份成功！备份路径：${result.backupPath}`);
        }
    } catch (error) {
        message.error('配置备份失败');
        console.error(error);
    } finally {
        backing.value = false;
    }
};

const reset = async () => {
    Modal.confirm({
        title: '确认重置配置',
        content: '此操作将重置所有配置为默认值，当前配置会自动备份。确定要继续吗？',
        okText: '确定重置',
        cancelText: '取消',
        okType: 'danger',
        async onOk() {
            resetting.value = true;
            try {
                const result = await resetAPI();
                if (result.success) {
                    message.success(result.message || '配置已重置为默认值');
                    await load();
                }
            } catch (error: any) {
                message.error(`重置配置失败: ${error.message || error}`);
                console.error('重置配置失败:', error);
            } finally {
                resetting.value = false;
            }
        }
    });
};

const saveAllConfigs = async () => {
    saving.value = true;
    try {
        const necessaryForSave: Record<string, string> = {};
        const optionalForSave: Record<string, string> = {};

        Object.values(filePaths.necessary).forEach(item => {
            necessaryForSave[item.name] = item.path;
        });

        Object.values(filePaths.optional).forEach(item => {
            optionalForSave[item.name] = item.path;
        });

        console.log('开始保存配置...', {
            necessary: necessaryForSave,
            optional: optionalForSave,
            extraFolders
        });

        const result = await saveAPI({
            necessary: necessaryForSave,
            optional: optionalForSave,
            extraFolders: [...extraFolders]
        });

        message.success('配置保存成功');
        await load();
    } catch (error: any) {
        console.error('保存配置失败:', error);
        message.error(`配置保存失败: ${error.message || error}`);
    } finally {
        saving.value = false;
    }
};

const createPathOperations = (type: 'necessary' | 'optional') => {

    const addPath = () => {
        const key = `path_${Date.now()}`;
        filePaths[type][key] = { name: '', path: '' };
        editingPaths[type][key] = true;
    };

    const cancelEditPath = (key: string) => {
        if (originalPaths[type][key]) {
            filePaths[type][key] = { ...originalPaths[type][key] };
            delete originalPaths[type][key];
        }
        else if (filePaths[type][key].name === '' && filePaths[type][key].path === '') {
            delete filePaths[type][key];
        }
        editingPaths[type][key] = false;
    };

    const deletePath = (key: string) => {
        delete filePaths[type][key];
        delete editingPaths[type][key];
        delete originalPaths[type][key];
    };

    const finishEditPath = (key: string) => {
        if (editingPaths[type][key]) {
            editingPaths[type][key] = false;
            delete originalPaths[type][key];
        }
    };

    return { addPath, cancelEditPath, deletePath, finishEditPath };
};

// 必需路径操作
const necessaryPathOps = createPathOperations('necessary');
const addNecessaryPath = necessaryPathOps.addPath;
const cancelEditNecessaryPath = necessaryPathOps.cancelEditPath;
const deleteNecessaryPath = necessaryPathOps.deletePath;
const finishEditNecessaryPath = necessaryPathOps.finishEditPath;

// 可选路径操作
const optionalPathOps = createPathOperations('optional');
const addOptionalPath = optionalPathOps.addPath;
const cancelEditOptionalPath = optionalPathOps.cancelEditPath;
const deleteOptionalPath = optionalPathOps.deletePath;
const finishEditOptionalPath = optionalPathOps.finishEditPath;

const addExtraFolder = () => {
    extraFolders.push('');
    editingFolder[extraFolders.length - 1] = true;
};

const cancelEditFolder = (index: number) => {
    if (originalFolders[index] !== undefined) {
        extraFolders[index] = originalFolders[index];
        delete originalFolders[index];
    }
    else if (extraFolders[index] === '') {
        extraFolders.splice(index, 1);
    }
    editingFolder[index] = false;
};

const deleteFolder = (index: number) => {
    Modal.confirm({
        title: '确认删除',
        content: `确定要删除文件夹 "${extraFolders[index]}" 吗？此操作不可撤销。`,
        okText: '确定',
        cancelText: '取消',
        onOk() {
            extraFolders.splice(index, 1);
            delete editingFolder[index];
        }
    });
};

const finishEditFolder = (index: number) => {
    if (editingFolder[index]) {
        editingFolder[index] = false;
        delete originalFolders[index];
    }
};


const updateEditingState = (type: 'necessary' | 'optional', key: string, isEditing: boolean) => {
    editingPaths[type][key] = isEditing;

    if (isEditing && !originalPaths[type][key]) {
        originalPaths[type][key] = { ...filePaths[type][key] };
    }
};

const updateEditingFolderState = (index: number, isEditing: boolean) => {
    editingFolder[index] = isEditing;

    if (isEditing && originalFolders[index] === undefined) {
        originalFolders[index] = extraFolders[index];
    }
};

onMounted(load);
</script>

<style scoped lang="scss">
.config-manager {
    display: flex;
    flex-direction: column;
    @include fullscreen-container;

    .config-content {
        flex: 1;
        max-height: calc(100vh - 120px);
        overflow-x: hidden;
        @include card-container;
        @include scrollable-container;

        .config-section {
            padding: 24px;

            .item-list {
                margin-bottom: 24px;
            }
        }
    }

    .config-actions {
        padding: 24px 0;
        margin-top: 16px;
        text-align: center;
        @include card-container;
    }

    :deep(.ant-space) {
        .ant-btn {
            margin: 0 10px;
        }
    }

    :deep(.ant-btn) {
        @include ant-btn;
    }
}
</style>