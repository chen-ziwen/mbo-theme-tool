<template>
  <div class="file-reslove">
    <div class="file-message-show">
      <a-alert message="配置提示" description="文件路径和额外文件夹现在可以在'配置管理'页面动态修改，无需重新编译应用程序。" type="info" show-icon
        style="margin-bottom: 16px;" />
      <a-collapse v-model:activeKey="activeKey">
        <a-collapse-panel key="1" header="执行成功">
          <FileMessage v-if="checkPath.suc.length > 0" :paths="checkPath.suc" type="success" text-color="green">
          </FileMessage>
          <span v-else>暂无 成功信息</span>
        </a-collapse-panel>
        <a-collapse-panel key="2" header="执行失败">
          <FileMessage v-if="checkPath.err.length > 0" :paths="checkPath.err" type="fail" text-color="red">
          </FileMessage>
          <span v-else>暂无 失败信息</span>
        </a-collapse-panel>
      </a-collapse>
    </div>
    <aside class="file-side">
      <div class="form-section resource-path-section">
        <div class="section-title">资源路径</div>
        <div class="input-row">
          <a-input v-model:value="form.remote" placeholder="新主题的图片路径" />
        </div>
        <div class="button-row">
          <a-button type="primary" @click="useOpenRemoteFolder">打开</a-button>
          <a-button type="primary" ghost @click="useCheckFolderName">检测</a-button>
        </div>
      </div>

      <div class="form-section theme-name-section">
        <div class="section-title">主题名称</div>
        <div class="input-row">
          <a-input v-model:value="form.theme" placeholder="新主题的键名(英文名)" />
        </div>
      </div>

      <div class="form-section project-path-section">
        <div class="section-title">项目路径</div>
        <div class="input-row">
          <a-input v-model:value="form.local" placeholder="咩播项目路径" />
        </div>
        <div class="button-row">
          <a-button type="primary" @click="useOpenLocalFolder">打开</a-button>
          <a-button type="primary" ghost @click="useCopyFileResource">复制</a-button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import FileMessage from '@/components/FileMessage.vue';

const openFolder = window.mt.dialog.openFolder;
const checkFolderName = window.mt.file.checkFolderName;
const copyFileResource = window.mt.file.copyFileResource;

const activeKey = ref<string[]>([]);
const form = reactive({
  theme: "",
  remote: "",
  local: "",
});

const checkPath = reactive({
  suc: [] as { path: string, text: string }[],
  err: [] as { path: string, text: string }[],
  disabled: true,
});

watch(() => form.remote, () => {
  checkPath.disabled = true;
})

async function useOpenFolder(text: string, callback: (path: string) => void) {
  const info = await openFolder();
  if (info.status) {
    callback(info.path);
  } else {
    message.error(text);
  }
}

function useOpenLocalFolder() {
  useOpenFolder("取消选择项目文件夹", (path: string) => {
    form.local = path;
  })
}

function useOpenRemoteFolder() {
  useOpenFolder("取消选择资源文件夹", (path: string) => {
    form.remote = path;
  })
}

async function useCheckFolderName() {
  if (form.remote == "") {
    message.error("资源路径不能为空");
    return;
  }
  try {
    const { suc, err, disabled } = await checkFolderName(form.remote);
    checkPath.suc = suc;
    checkPath.err = err;
    checkPath.disabled = disabled;
    activeKey.value.splice(0, activeKey.value.length, "1", "2");
    message.success("检测成功!");
  } catch (err) {
    message.error("资源路径不存在！");
  }
}

async function useCopyFileResource() {
  if (form.theme == "" || form.local == "" || form.remote == "") {
    message.error("资源路径，主题名称，项目路径都不能为空！！！");
    return;
  }
  try {
    const { suc, err, disabled } = await copyFileResource({
      theme: form.theme,
      src: form.local,
      destPath: form.remote
    });
    checkPath.suc = suc;
    checkPath.err = err;
    checkPath.disabled = disabled;
    activeKey.value.splice(0, activeKey.value.length, "1", "2");
    message.success("复制成功！");
  } catch (e) {
    message.error("复制失败！");
  }
}
</script>

<style scoped lang="scss">
.file-reslove {
  display: flex;
  width: 100%;
  height: 100%;
  background: $background-gradient;
  min-height: 100vh;
  padding: 24px;
  gap: 24px;

  .file-message-show {
    flex: 3;
    padding: 24px;
    @include scrollable-container;
    @include card-container;
  }

  .file-side {
    flex: 2;
    position: relative;
    @include card-container;
    @include scrollable-container;
  }

  :deep(.ant-alert) {
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);

    .ant-alert-icon {
      color: #1976d2;
    }

    .ant-alert-message {
      color: #1565c0;
      font-weight: 600;
    }

    .ant-alert-description {
      color: #1976d2;
    }
  }

  :deep(.ant-collapse) {
    background: transparent;
    border: none;

    .ant-collapse-item {
      margin-bottom: 16px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.06);

      .ant-collapse-header {
        border-radius: 8px 8px 0 0;
        background: rgba(255, 255, 255, 0.9);
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        font-weight: 600;
        color: #2c3e50;

        &:hover {
          background: rgba(24, 144, 255, 0.1);
        }
      }

      .ant-collapse-content {
        background: rgba(255, 255, 255, 0.8);
        border-radius: 0 0 8px 8px;

        .ant-collapse-content-box {
          padding: 16px;
        }
      }
    }
  }

  :deep(.ant-form) {
    .ant-form-item {
      margin-bottom: 24px;

      .ant-form-item-label {
        >label {
          color: #2c3e50;
          font-weight: 600;
          font-size: 14px;

          &::before {
            content: '';
            display: inline-block;
            width: 3px;
            height: 14px;
            background: $primary-gradient;
            margin-right: 8px;
            border-radius: 2px;
          }
        }
      }

      .ant-input-group {
        .ant-input {
          @include input-style;
        }
      }
    }
  }

  :deep(.ant-btn) {
    @include ant-btn;
  }

  .form-section {
    @include form-section;

    &.resource-path-section {
      border-left: 4px solid #52c41a;
    }

    &.theme-name-section {
      border-left: 4px solid #1890ff;
    }

    &.project-path-section {
      border-left: 4px solid #722ed1;
    }
  }

  .section-title {
    @include icon-title;
    margin-bottom: 12px;
    font-size: 16px;
  }

  .input-row {
    margin-bottom: 16px;

    .ant-input {
      width: 100%;
      @include input-style;
    }
  }

  .button-row {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}
</style>
