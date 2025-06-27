<template>
    <div class="config-manager">
        <div class="config-content">
            <a-tabs v-model:activeKey="activeTab" type="card">
                <!-- 文件路径配置 -->
                <a-tab-pane key="paths" tab="文件路径配置">
                    <div class="config-section">
                        <div class="section-header">
                            <h3>必需文件路径</h3>
                            <a-button type="primary" @click="addNecessaryPath">添加路径</a-button>
                        </div>
                        <div class="path-list">
                            <div v-for="(item, key) in filePaths.necessary" :key="item.path" class="path-item">
                                <a-input-group compact>
                                    <a-input v-model:value="item.name" placeholder="文件名" style="width: 30%"
                                        :disabled="!editingPaths.necessary[key]" @blur="finishEditNecessaryPath(key)" />
                                    <a-input v-model:value="item.path" placeholder="文件路径" style="width: 50%"
                                        :disabled="!editingPaths.necessary[key]" @blur="finishEditNecessaryPath(key)" />
                                    <a-button-group style="width: 20%">
                                        <a-button v-if="!editingPaths.necessary[key]"
                                            @click="editNecessaryPath(key)">编辑</a-button>
                                        <a-button v-if="editingPaths.necessary[key]"
                                            @click="cancelEditNecessaryPath(key)">取消</a-button>
                                        <a-button danger @click="deleteNecessaryPath(key)">删除</a-button>
                                    </a-button-group>
                                </a-input-group>
                            </div>
                        </div>

                        <div class="section-header" style="margin-top: 30px;">
                            <h3>可选文件路径</h3>
                            <a-button type="primary" @click="addOptionalPath">添加路径</a-button>
                        </div>
                        <div class="path-list">
                            <div v-for="(item, key) in filePaths.optional" :key="key" class="path-item">
                                <a-input-group compact>
                                    <a-input v-model:value="item.name" placeholder="文件名" style="width: 30%"
                                        :disabled="!editingPaths.optional[key]" @blur="finishEditOptionalPath(key)" />
                                    <a-input v-model:value="item.path" placeholder="文件路径" style="width: 50%"
                                        :disabled="!editingPaths.optional[key]" @blur="finishEditOptionalPath(key)" />
                                    <a-button-group style="width: 20%">
                                        <a-button v-if="!editingPaths.optional[key]"
                                            @click="editOptionalPath(key)">编辑</a-button>
                                        <a-button v-if="editingPaths.optional[key]"
                                            @click="cancelEditOptionalPath(key)">取消</a-button>
                                        <a-button danger @click="deleteOptionalPath(key)">删除</a-button>
                                    </a-button-group>
                                </a-input-group>
                            </div>
                        </div>
                    </div>
                </a-tab-pane>

                <!-- 额外文件夹配置 -->
                <a-tab-pane key="folders" tab="额外文件夹配置">
                    <div class="config-section">
                        <div class="section-header">
                            <h3>额外文件夹列表</h3>
                            <a-button type="primary" @click="addExtraFolder">添加文件夹</a-button>
                        </div>
                        <div class="folder-list">
                            <div v-for="(_, index) in extraFolders" :key="index" class="folder-item">
                                <a-input-group compact>
                                    <a-input v-model:value="extraFolders[index]" placeholder="文件夹路径" style="width: 80%"
                                        :disabled="!editingFolder[index]" @blur="finishEditFolder(index)" />
                                    <a-button-group style="width: 20%">
                                        <a-button v-if="!editingFolder[index]" @click="editFolder(index)">编辑</a-button>
                                        <a-button v-if="editingFolder[index]"
                                            @click="cancelEditFolder(index)">取消</a-button>
                                        <a-button danger @click="deleteFolder(index)">删除</a-button>
                                    </a-button-group>
                                </a-input-group>
                            </div>
                        </div>
                    </div>
                </a-tab-pane>
            </a-tabs>
        </div>

        <div class="config-actions">
            <a-space>
                <a-button type="primary" size="large" @click="saveAllConfigs" :loading="saving">保存配置</a-button>
                <a-button size="large" @click="backupConfigs" :loading="backing">备份配置</a-button>
                <a-button size="large" @click="loadConfigs" :loading="loading">重新加载</a-button>
                <a-button size="large" danger @click="resetConfigs" :loading="resetting">重置配置</a-button>
            </a-space>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';

// 获取electronAPI方法
const loadConfigsAPI = window.electronAPI.loadConfigs;
const saveConfigsAPI = window.electronAPI.saveConfigs;
const backupConfigsAPI = window.electronAPI.backupConfigs;
const resetConfigsAPI = window.electronAPI.resetConfigs;

const activeTab = ref('paths');

// 加载状态
const loading = ref(false);
const saving = ref(false);
const backing = ref(false);
const resetting = ref(false);

// 文件路径配置
const filePaths = reactive<{
    necessary: Record<string, { name: string, path: string }>;
    optional: Record<string, { name: string, path: string }>;
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
    necessary: Record<string, { name: string, path: string }>;
    optional: Record<string, { name: string, path: string }>;
}>({
    necessary: {},
    optional: {}
});

// 额外文件夹配置
const extraFolders = reactive<string[]>([]);
const editingFolder = reactive<Record<string, boolean>>({});
const originalFolders = reactive<string[]>([]);

// 加载配置
const loadConfigs = async () => {
    loading.value = true;
    try {
        const configs = await loadConfigsAPI();

        // 清空现有数据
        filePaths.necessary = {};
        filePaths.optional = {};
        extraFolders.splice(0);

        // 加载新数据 - 转换旧格式到新格式
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

        // 清空原始数据
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

// 备份配置
const backupConfigs = async () => {
    backing.value = true;
    try {
        const result = await backupConfigsAPI();
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

// 重置配置
const resetConfigs = async () => {
    Modal.confirm({
        title: '确认重置配置',
        content: '此操作将重置所有配置为默认值，当前配置会自动备份。确定要继续吗？',
        okText: '确定重置',
        cancelText: '取消',
        okType: 'danger',
        async onOk() {
            resetting.value = true;
            try {
                const result = await resetConfigsAPI();
                if (result.success) {
                    message.success(result.message || '配置已重置为默认值');
                    await loadConfigs(); // 重新加载配置
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

// 保存所有配置
const saveAllConfigs = async () => {
    saving.value = true;
    try {
        const necessaryForSave: Record<string, string> = {};
        const optionalForSave: Record<string, string> = {};

        Object.entries(filePaths.necessary).forEach(([_, item]) => {
            necessaryForSave[item.name] = item.path;
        });

        Object.entries(filePaths.optional).forEach(([_, item]) => {
            optionalForSave[item.name] = item.path;
        });

        console.log('开始保存配置...', {
            necessary: necessaryForSave,
            optional: optionalForSave,
            extraFolders
        });

        const result = await saveConfigsAPI({
            necessary: necessaryForSave,
            optional: optionalForSave,
            extraFolders: [...extraFolders]
        });

        console.log('保存配置结果:', result);
        message.success('配置保存成功');
        await loadConfigs();
    } catch (error: any) {
        console.error('保存配置失败:', error);
        message.error(`配置保存失败: ${error.message || error}`);
    } finally {
        saving.value = false;
    }
};

// 通用路径操作函数
const createPathOperations = (type: 'necessary' | 'optional') => {
    const addPath = () => {
        const key = `path_${Date.now()}`;
        filePaths[type][key] = { name: '', path: '' };
        editingPaths[type][key] = true;
    };

    const editPath = (key: string) => {
        // 在开始编辑时保存原始数据的深拷贝
        if (originalPaths[type][key] === undefined) {
            originalPaths[type][key] = { ...filePaths[type][key] };
        }
        editingPaths[type][key] = true;
    };

    const cancelEditPath = (key: string) => {
        if (originalPaths[type][key] !== undefined) {
            filePaths[type][key] = { ...originalPaths[type][key] };
        } else {
            delete filePaths[type][key];
        }
        editingPaths[type][key] = false;
    };

    const deletePath = (key: string) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除路径 "${filePaths[type][key]?.name || key}" 吗？此操作不可撤销。`,
            okText: '确定',
            cancelText: '取消',
            onOk() {
                delete filePaths[type][key];
                delete editingPaths[type][key];
            }
        });
    };

    return { addPath, editPath, cancelEditPath, deletePath };
};

// 必需路径操作
const necessaryPathOps = createPathOperations('necessary');
const addNecessaryPath = necessaryPathOps.addPath;
const editNecessaryPath = necessaryPathOps.editPath;
const cancelEditNecessaryPath = necessaryPathOps.cancelEditPath;
const deleteNecessaryPath = necessaryPathOps.deletePath;

// 可选路径操作
const optionalPathOps = createPathOperations('optional');
const addOptionalPath = optionalPathOps.addPath;
const editOptionalPath = optionalPathOps.editPath;
const cancelEditOptionalPath = optionalPathOps.cancelEditPath;
const deleteOptionalPath = optionalPathOps.deletePath;

// 完成编辑操作（失去焦点时调用）
const finishEditNecessaryPath = (key: string) => {
    if (editingPaths.necessary[key]) {
        editingPaths.necessary[key] = false;
        // 清除原始数据缓存
        delete originalPaths.necessary[key];
    }
};

const finishEditOptionalPath = (key: string) => {
    if (editingPaths.optional[key]) {
        editingPaths.optional[key] = false;
        // 清除原始数据缓存
        delete originalPaths.optional[key];
    }
};

// 文件夹相关操作
const addExtraFolder = () => {
    extraFolders.push('');
    editingFolder[extraFolders.length - 1] = true;
};

const editFolder = (index: number) => {
    // 在开始编辑时保存原始数据
    if (originalFolders[index] === undefined) {
        originalFolders[index] = extraFolders[index];
    }
    editingFolder[index] = true;
};

const cancelEditFolder = (index: number) => {
    if (originalFolders[index] !== undefined) {
        extraFolders[index] = originalFolders[index];
    } else {
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

// 完成文件夹编辑操作（失去焦点时调用）
const finishEditFolder = (index: number) => {
    if (editingFolder[index]) {
        editingFolder[index] = false;
        // 清除原始数据缓存
        delete originalFolders[index];
    }
};

onMounted(loadConfigs);
</script>

<style scoped lang="scss">
.config-manager {
    padding: 24px;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;

    .config-content {
        flex: 1;
        overflow: auto;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        max-height: calc(100vh - 120px);
        overflow-y: auto;

        &::-webkit-scrollbar {
            width: 8px;
        }

        &::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 4px;

            &:hover {
                background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
            }
        }

        .config-section {
            padding: 24px;

            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 2px solid #e8f4fd;

                h3 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 18px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;

                    &::before {
                        content: '';
                        width: 4px;
                        height: 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        margin-right: 12px;
                        border-radius: 2px;
                    }
                }
            }

            .theme-list,
            .path-list,
            .folder-list {

                .theme-item,
                .path-item,
                .folder-item {
                    margin-bottom: 16px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 8px;
                    border: 1px solid rgba(0, 0, 0, 0.06);
                    transition: all 0.3s ease;

                    &:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        border-color: #1890ff;
                    }

                    :deep(.ant-input-group) {
                        display: flex;
                        align-items: stretch;
                        width: 100%;

                        .ant-input {
                            flex: 1;
                        }

                        .ant-btn-group {
                            display: flex;
                            align-items: center;
                        }
                    }
                }
            }
        }
    }

    .config-actions {
        padding: 24px 0;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 12px;
        margin-top: 16px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
}

:deep(.ant-tabs) {
    .ant-tabs-nav {
        margin-bottom: 0;

        .ant-tabs-tab {
            border-radius: 8px 8px 0 0;
            border: none;
            background: rgba(255, 255, 255, 0.6);
            margin-right: 4px;
            transition: all 0.3s ease;

            &:hover {
                background: rgba(255, 255, 255, 0.8);
            }

            &.ant-tabs-tab-active {
                background: rgba(255, 255, 255, 0.9);

                .ant-tabs-tab-btn {
                    color: #1890ff;
                    font-weight: 600;
                }
            }
        }
    }

    .ant-tabs-content-holder {
        padding: 0;
        background: transparent;
    }
}

:deep(.ant-input-group) {
    display: flex;
    align-items: center;

    .ant-input {
        border-radius: 6px;
        border: 1px solid #d9d9d9;
        transition: all 0.3s ease;

        &:focus {
            border-color: #1890ff;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }

        &:disabled {
            background: #f5f5f5;
            color: #999;
        }
    }
}

:deep(.ant-btn-group) {
    display: flex;
    width: 100%;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;

    .ant-btn {
        border-radius: 6px;
        margin-left: 0;
        font-weight: 500;
        transition: all 0.3s ease;
        flex-shrink: 0;
        min-width: 60px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.ant-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;

            &:hover {
                background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
                transform: translateY(-1px);
            }
        }

        &.ant-btn-dangerous {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            border: none;
            color: white;

            &:hover {
                background: linear-gradient(135deg, #ff5252 0%, #e53935 100%);
                transform: translateY(-1px);
            }
        }

        &:not(.ant-btn-primary):not(.ant-btn-dangerous) {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #d9d9d9;

            &:hover {
                border-color: #1890ff;
                color: #1890ff;
                transform: translateY(-1px);
            }
        }
    }
}

:deep(.ant-space) {
    .ant-btn {
        padding: 8px 24px;
        height: auto;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s ease;

        &.ant-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;

            &:hover {
                background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }
        }

        &:not(.ant-btn-primary) {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #d9d9d9;

            &:hover {
                border-color: #1890ff;
                color: #1890ff;
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
        }
    }
}
</style>