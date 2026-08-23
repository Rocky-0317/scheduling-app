<script setup lang="ts">
import { onBackPress, onLoad, onUnload } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import {
  clearPendingAppUpdate,
  dismissAppUpdate,
  getPendingAppUpdate,
} from '@/utils/appUpdate'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '应用更新',
    backgroundColor: 'transparent',
    disableScroll: true,
  },
})

const update = ref(getPendingAppUpdate())
const downloading = ref(false)
const installing = ref(false)
const progress = ref(0)
const errorMessage = ref('')
const countdown = ref(5)
let downloadTask: PlusDownloaderDownload | null = null
let autoUpdateTimer: ReturnType<typeof setInterval> | undefined
let handlingFailure = false
let updateContinuesInBackground = false
const updateFailedMessage = '自动更新失败，请卸载原有应用，前往网页版重新扫码下载最新 APP'

const actionText = computed(() => {
  if (installing.value)
    return '正在调起系统安装器…'
  if (downloading.value)
    return `正在下载 ${progress.value}%`
  if (errorMessage.value)
    return '自动更新失败'
  return `${countdown.value}s 后自动更新`
})

function clearAutoUpdateTimer() {
  if (!autoUpdateTimer)
    return
  clearInterval(autoUpdateTimer)
  autoUpdateTimer = undefined
}

function resetTask(message = '') {
  downloading.value = false
  installing.value = false
  errorMessage.value = message
  downloadTask = null
}

function showUpdateFailureModal() {
  uni.showModal({
    title: '更新失败',
    content: updateFailedMessage,
    showCancel: false,
    confirmText: '知道了',
  })
}

function handleUpdateFailure(error?: unknown) {
  if (handlingFailure)
    return

  handlingFailure = true
  if (error)
    console.error('APP 自动更新失败', error)

  clearAutoUpdateTimer()
  if (downloadTask && downloading.value)
    downloadTask.abort()
  resetTask(updateFailedMessage)
  clearPendingAppUpdate()

  if (updateContinuesInBackground) {
    showUpdateFailureModal()
    return
  }

  uni.navigateBack({ complete: showUpdateFailureModal })
}

function validateUpdatePackage() {
  if (!update.value?.downloadUrl)
    return '未配置安装包下载地址'
  if (update.value.packageType && update.value.packageType !== 'apk')
    return `当前客户端仅支持 APK 整包更新，服务端下发了 ${update.value.packageType.toUpperCase()} 包`
  const packageName = `${update.value.apkFileName || ''} ${update.value.downloadUrl.split('?')[0]}`.toLowerCase()
  if (/\.(?:zip|wgt)\b/.test(packageName))
    return '当前客户端仅支持 APK 整包更新，请在发布后台上传 APK 文件'
  if (!/^https?:\/\//i.test(update.value.downloadUrl))
    return '安装包下载地址不合法'
  return ''
}

function installApk(filename: string) {
  installing.value = true
  plus.runtime.install(
    filename,
    { force: false },
    () => {
      resetTask()
      clearPendingAppUpdate()
      uni.showToast({ title: '请在系统页面完成安装', icon: 'none', duration: 3000 })
    },
    (error) => {
      handleUpdateFailure(error)
    },
  )
}

function verifyAndInstall(filename: string) {
  if (!update.value?.apkFileSize) {
    installApk(filename)
    return
  }

  plus.io.resolveLocalFileSystemURL(filename, (entry: any) => {
    entry.getMetadata((metadata: any) => {
      const expectedSize = Number(update.value?.apkFileSize || 0)
      if (expectedSize > 0 && Number(metadata.size) !== expectedSize) {
        entry.remove(() => {}, () => {})
        handleUpdateFailure(new Error('APK 文件大小与服务端记录不一致'))
        return
      }
      installApk(filename)
    }, error => handleUpdateFailure(error))
  }, error => handleUpdateFailure(error))
}

function startUpdate() {
  if (downloading.value || installing.value)
    return

  clearAutoUpdateTimer()

  const validationError = validateUpdatePackage()
  if (validationError) {
    handleUpdateFailure(new Error(validationError))
    return
  }

  errorMessage.value = ''
  progress.value = 0

  // #ifdef APP-PLUS
  downloading.value = true
  const savePath = `_downloads/app_update_${update.value!.versionCode}_${Date.now()}.apk`
  downloadTask = plus.downloader.createDownload(
    update.value!.downloadUrl,
    { filename: savePath, timeout: 300 },
    (download, status) => {
      if (status === 200 && download.filename) {
        downloading.value = false
        progress.value = 100
        verifyAndInstall(download.filename)
        return
      }
      handleUpdateFailure({ status, download })
    },
  )
  downloadTask.addEventListener('statechanged', (task) => {
    if (task.state === 3 && task.totalSize > 0)
      progress.value = Math.min(99, Math.round(task.downloadedSize / task.totalSize * 100))
  })
  downloadTask.start()
  // #endif

  // #ifndef APP-PLUS
  handleUpdateFailure(new Error('当前环境不支持 APP 整包更新'))
  // #endif
}

function closeUpdatePopup() {
  // 关闭的只是提示页；倒计时、下载和安装流程继续在后台执行。
  updateContinuesInBackground = true
  uni.navigateBack()
}

function startAutoUpdateCountdown() {
  clearAutoUpdateTimer()
  countdown.value = 5
  autoUpdateTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0)
      startUpdate()
  }, 1000)
}

onLoad(() => {
  update.value = getPendingAppUpdate()
  if (!update.value) {
    errorMessage.value = '更新信息已失效，请返回后重试'
    return
  }

  startAutoUpdateCountdown()
})

onBackPress(() => {
  if (updateContinuesInBackground)
    return false

  clearAutoUpdateTimer()
  if (downloadTask && downloading.value)
    downloadTask.abort()
  if (update.value)
    dismissAppUpdate(update.value.versionCode)
  clearPendingAppUpdate()
  return false
})

onUnload(() => {
  if (updateContinuesInBackground)
    return

  clearAutoUpdateTimer()
  if (downloadTask && downloading.value)
    downloadTask.abort()
})
</script>

<template>
  <view class="update-page">
    <view class="update-card">
      <view class="close-button" @click="closeUpdatePopup">
        <text>×</text>
      </view>
      <view class="update-icon">
        <text class="update-arrow">↑</text>
      </view>
      <text class="update-kicker">APP UPDATE</text>
      <text class="update-title">{{ update?.updateTitle || '发现新版本' }}</text>
      <view v-if="update" class="version-row">
        <text>v{{ update.localVersionName || '-' }}</text>
        <text class="version-line">→</text>
        <text class="latest-version">v{{ update.versionName }}</text>
      </view>

      <scroll-view scroll-y class="update-content">
        <text>{{ update?.updateContent || '新版本已准备就绪，建议立即更新。' }}</text>
      </scroll-view>

      <view v-if="downloading || installing" class="progress-block">
        <view class="progress-track">
          <view class="progress-fill" :style="{ width: `${progress}%` }" />
        </view>
        <text class="progress-text">{{ actionText }}</text>
      </view>

      <view v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </view>

      <text class="auto-update-message">{{ actionText }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.update-page {
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: calc(var(--status-bar-height) + 48rpx) 40rpx 48rpx;
  background: rgba(15, 23, 42, 0.58);
}

.update-card {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 64rpx 42rpx 44rpx;
  border: 1rpx solid rgba(47, 125, 255, 0.12);
  border-radius: 36rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24rpx 70rpx rgba(36, 83, 151, 0.13);
  text-align: center;
}

.close-button {
  position: absolute;
  top: 22rpx;
  right: 22rpx;
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7b8798;
  background: #f1f4f8;
  font-size: 42rpx;
  line-height: 1;
}

.update-icon {
  width: 116rpx;
  height: 116rpx;
  margin: 0 auto 28rpx;
  border-radius: 34rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(145deg, #4f91ff, #2468e8);
  box-shadow: 0 18rpx 36rpx rgba(47, 125, 255, 0.3);
}

.update-arrow {
  font-size: 70rpx;
  font-weight: 300;
  line-height: 1;
}
.update-kicker {
  display: block;
  color: #2f7dff;
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 5rpx;
}
.update-title {
  display: block;
  margin-top: 16rpx;
  color: #172033;
  font-size: 42rpx;
  font-weight: 700;
}
.version-row {
  display: flex;
  justify-content: center;
  gap: 18rpx;
  margin-top: 20rpx;
  color: #8a96a8;
  font-size: 25rpx;
}
.version-line {
  color: #b5bdc9;
}
.latest-version {
  color: #2f7dff;
  font-weight: 600;
}
.update-content {
  max-height: 280rpx;
  box-sizing: border-box;
  margin: 38rpx 0;
  padding: 28rpx;
  border-radius: 20rpx;
  color: #4b5565;
  background: #f6f9fd;
  font-size: 28rpx;
  line-height: 1.75;
  text-align: left;
  white-space: pre-wrap;
}
.progress-block {
  margin: 0 0 30rpx;
}
.progress-track {
  height: 14rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #e8eef7;
}
.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2f7dff, #65a2ff);
  transition: width 0.2s ease;
}
.progress-text {
  display: block;
  margin-top: 14rpx;
  color: #667085;
  font-size: 24rpx;
}
.error-message {
  margin-bottom: 26rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  color: #d92d20;
  background: #fff2f0;
  font-size: 24rpx;
  line-height: 1.5;
  text-align: left;
}
.auto-update-message {
  display: block;
  min-height: 44rpx;
  color: #2f7dff;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 1.5;
}
</style>
