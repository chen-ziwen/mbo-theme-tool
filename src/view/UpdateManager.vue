<template>
  <div class="update-manager">
    <div class="update-container">
      <!-- 头部区域 -->
      <div class="update-header">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <div class="header-content">
          <h2 class="header-title">应用更新</h2>
          <p class="header-subtitle">保持应用最新，享受最佳体验</p>
        </div>
      </div>

      <!-- 版本信息卡片 -->
      <div class="version-card">
        <div class="version-item current">
          <div class="version-label">当前版本</div>
          <div class="version-number">{{ currentVersion }}</div>
          <div class="version-status">正在运行</div>
        </div>

        <div v-if="updateInfo" class="version-item latest">
          <div class="version-label">最新版本</div>
          <div class="version-number">{{ updateInfo.version }}</div>
          <div class="version-status new">可更新</div>
        </div>
      </div>

      <!-- 更新说明 -->
      <div v-if="updateInfo && updateInfo.releaseNotes" class="release-notes-card">
        <h3 class="notes-title">
          <svg viewBox="0 0 24 24" fill="currentColor" class="notes-icon">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
          更新说明
        </h3>
        <div class="release-notes" v-html="updateInfo.releaseNotes"></div>
      </div>

      <!-- 操作按钮 -->
      <div class="update-actions">
        <button class="action-btn primary" :class="{ loading: checking, disabled: downloading }" @click="checkForUpdates"
          :disabled="downloading">
          <svg v-if="checking" class="btn-icon spin" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
          </svg>
          <svg v-else class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
          </svg>
          {{ checking ? '检查中...' : '检查更新' }}
        </button>

        <button v-if="updateAvailable" class="action-btn success" :class="{ loading: downloading }"
          @click="downloadAndInstall">
          <svg v-if="downloading" class="btn-icon spin" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
          </svg>
          <svg v-else class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
          </svg>
          {{ downloading ? '下载中...' : '下载并安装' }}
        </button>
      </div>



      <!-- 消息提示区域 -->
      <div class="message-container">
        <div v-if="message" class="update-message" :class="messageType">
          <div class="message-icon">
            <svg v-if="messageType === 'success'" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <svg v-else-if="messageType === 'error'" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>
          </div>
          <div class="message-content">
            <span>{{ message }}</span>
            <button class="message-close" @click="message = ''">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const currentVersion = ref('');
const updateInfo = ref<{
  updateAvailable: boolean;
  version?: string;
  releaseNotes?: string;
} | null>(null);
const updateAvailable = ref(false);
const checking = ref(false);
const downloading = ref(false);
const message = ref('');
const messageType = ref('info');

// 获取当前版本
const getCurrentVersion = async () => {
  try {
    currentVersion.value = await window.mt.update.getAppVersion()
  } catch (error) {
    console.error('获取版本信息失败:', error)
  }
}

const checkForUpdates = async () => {
  checking.value = true
  message.value = ''

  try {
    const result = await window.mt.update.checkForUpdates()

    if (result && result.updateAvailable) {
      updateInfo.value = result
      updateAvailable.value = true
      message.value = `发现新版本 ${result.version}，可以更新！`
      messageType.value = 'success'
    } else {
      updateAvailable.value = false
      message.value = '当前已是最新版本'
      messageType.value = 'info'
    }
  } catch (error) {
    console.error('检查更新失败:', error)
    if (error instanceof Error) {
      message.value = `检查更新失败: ${error.message}`
    } else {
      message.value = '检查更新失败，请稍后重试'
    }
    messageType.value = 'error'
  } finally {
    checking.value = false
  }
}

// 下载并安装更新
const downloadAndInstall = async () => {
  downloading.value = true
  message.value = '正在下载更新...'
  messageType.value = 'info'

  try {
    await window.mt.update.downloadUpdate()
    message.value = '下载完成，应用将重启并安装更新'
    messageType.value = 'success'

    setTimeout(() => {
      window.mt.update.quitAndInstall()
    }, 1000)
  } catch (error: any) {
    message.value = error?.message || '下载更新失败，请稍后重试'
    messageType.value = 'error'
  } finally {
    downloading.value = false
  }
}

onMounted(() => {
  getCurrentVersion()
})
</script>

<style lang="scss" scoped>
.update-manager {
  min-height: 100vh;
  height: 100vh;
  background: #f8fafc;
  padding: 2rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  box-sizing: border-box;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    transition: background 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.5);
    }
  }
}

.update-container {
  max-width: 600px;
  width: 100%;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  margin: 2rem 0;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  box-sizing: border-box;

  // 内容区域滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    transition: background 0.2s;

    &:hover {
      background: #a1a1a1;
    }
  }
}

// 头部样式
.update-header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.header-icon {
  width: 60px;
  height: 60px;
  background: #4299e1;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;

  svg {
    width: 32px;
    height: 32px;
    color: white;
  }
}

.header-content {
  flex: 1;
}

.header-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 0.25rem 0;
}

.header-subtitle {
  color: #718096;
  margin: 0;
  font-size: 0.95rem;
}

// 版本卡片
.version-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.version-item {
  background: #f7fafc;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  border: 1px solid #e2e8f0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  &.latest {
    background: #e6fffa;
    border: 2px solid #38b2ac;
  }
}

.version-label {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.version-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.version-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: #e2e8f0;
  color: #4a5568;
  display: inline-block;

  &.new {
    background: #38b2ac;
    color: white;
  }
}

// 更新说明卡片
.release-notes-card {
  background: #f7fafc;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-left: 4px solid #4299e1;
}

.notes-title {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 1rem 0;
}

.notes-icon {
  width: 20px;
  height: 20px;
  margin-right: 0.5rem;
  color: #4299e1;
}

.release-notes {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

// 操作按钮
.update-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &.primary {
    background: #4299e1;
    color: white;

    &:hover {
      background: #3182ce;
    }
  }

  &.success {
    background: #48bb78;
    color: white;

    &:hover {
      background: #38a169;
    }
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
}

.btn-icon {
  width: 20px;
  height: 20px;

  &.spin {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

// 下载进度
.download-progress {
  background: #f7fafc;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.progress-label {
  font-weight: 600;
  color: #2d3748;
}

.progress-percent {
  font-weight: 700;
  color: #4299e1;
  font-size: 1.125rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-fill {
  height: 100%;
  background: #4299e1;
  border-radius: 4px;
  transition: width 0.3s ease;

  &.complete {
    background: #48bb78;
  }
}

.progress-text {
  text-align: center;
  color: #718096;
  font-size: 0.875rem;
  margin: 0;
}

// 消息提示区域
.message-container {
  margin-top: 1rem;
  min-height: 80px;
  display: flex;
  align-items: flex-start;
}

// 消息提示
.update-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  width: 100%;
  min-height: 60px;

  &.success {
    background: #f0fff4;
    border: 1px solid #9ae6b4;
    color: #22543d;
  }

  &.error {
    background: #fff5f5;
    border: 1px solid #fc8181;
    color: #742a2a;
  }

  &.info {
    background: #ebf8ff;
    border: 1px solid #90cdf4;
    color: #2a4365;
  }
}

.message-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
  }
}

.message-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .update-manager {
    padding: 1rem;
  }

  .update-container {
    padding: 1.5rem;
  }

  .version-card {
    grid-template-columns: 1fr;
  }

  .update-actions {
    flex-direction: column;
  }

  .header-title {
    font-size: 1.5rem;
  }
}
</style>