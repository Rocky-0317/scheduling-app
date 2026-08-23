<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { navigateToInterceptor } from '@/router/interceptor'
import { useDictStore, useTokenStore } from '@/store'
import { hasTokenInfo, isAccessTokenExpired } from '@/utils/auth'
import { toLoginPage } from '@/utils/toLoginPage'

interface UpdatePopupParams {
  latestVersion?: string
  localVersion?: string
  updateTitle?: string
  updateContent?: string
  downloadUrl?: string
  forceUpdate?: boolean
}

const popupOpen = ref(false)
const latestVersion = ref('')
const localVersion = ref('')
const updateTitle = ref('发现新版本')
const updateContent = ref('请更新到最新版本后继续使用')
const downloadUrl = ref('')
const forceUpdate = ref(false)
const downloading = ref(false)
const downloadProgress = ref(0)
const installing = ref(false)
const autoUpdateCountdown = ref(5)
let autoUpdateTimer: ReturnType<typeof setInterval> | undefined

const updateProgressText = computed(() => {
  if (installing.value)
    return '正在安装 APK 100%'
  if (downloading.value)
    return `正在下载 ${downloadProgress.value}%`
  return `${autoUpdateCountdown.value}s 后自动更新 0%`
})

function syncTabbarWhenPageVisible() {}

function getAppShowUrl(options?: any) {
  return options?.path ? `/${options.path}` : '/'
}

function runGlobalAuthGuard(options?: any) {
  const tokenStore = useTokenStore().updateNowTime()
  const url = getAppShowUrl(options)
  // App 启动和切回前台时先做本地过期校验，过期 token 不再放行业务页面首屏。
  if (hasTokenInfo(tokenStore.tokenInfo) && isAccessTokenExpired()) {
    uni.showLoading({
      title: '登录状态校验中',
      mask: true,
    })
    tokenStore.clearLocalLoginState()
    setTimeout(() => {
      uni.hideLoading()
      navigateToInterceptor.invoke({ url, query: options?.query })
    }, 0)
    return false
  }
  const allow = navigateToInterceptor.invoke({ url, query: options?.query })
  if (allow === false) {
    setTimeout(() => {
      toLoginPage.flush()
    }, 0)
  }
  return allow !== false
}

onLaunch((options) => {
  runGlobalAuthGuard(options)
  console.log('App初始化', options)
})

onMounted(() => {
  uni.$on('app:openUpdatePopup', (params: UpdatePopupParams = {}) => {
    console.log('✅ 成功接收更新弹窗事件', params)
    latestVersion.value = params.latestVersion || ''
    localVersion.value = params.localVersion || ''
    updateTitle.value = params.updateTitle || '发现新版本'
    updateContent.value = params.updateContent || '请更新到最新版本后继续使用'
    downloadUrl.value = params.downloadUrl || ''
    forceUpdate.value = Boolean(params.forceUpdate)
    downloadProgress.value = 0
    downloading.value = false
    installing.value = false
    setTimeout(() => {
      popupOpen.value = true
      console.log('弹窗开关已置为true', popupOpen.value)
      startAutoUpdateCountdown()
    }, 100)
  })

  // #ifdef H5
  document.addEventListener('visibilitychange', syncTabbarWhenPageVisible)
  window.addEventListener('pageshow', syncTabbarWhenPageVisible)
  // #endif
})

onUnmounted(() => {
  uni.$off('app:openUpdatePopup')
  clearAutoUpdateTimer()
  // #ifdef H5
  document.removeEventListener('visibilitychange', syncTabbarWhenPageVisible)
  window.removeEventListener('pageshow', syncTabbarWhenPageVisible)
  // #endif
})

function clearAutoUpdateTimer() {
  if (!autoUpdateTimer)
    return
  clearInterval(autoUpdateTimer)
  autoUpdateTimer = undefined
}

function startAutoUpdateCountdown() {
  clearAutoUpdateTimer()
  autoUpdateCountdown.value = 5
  autoUpdateTimer = setInterval(() => {
    autoUpdateCountdown.value -= 1
    if (autoUpdateCountdown.value > 0)
      return
    clearAutoUpdateTimer()
    handleUpdate()
  }, 1000)
}

function resetUpdateLoading() {
  downloading.value = false
  installing.value = false
}

function downloadAndInstallApk() {
  if (downloading.value || installing.value)
    return

  // #ifdef APP-PLUS
  downloading.value = true
  installing.value = false
  downloadProgress.value = 0

  const apkSavePath = `_downloads/app_update_${Date.now()}.apk`
  const downloadTask = plus.downloader.createDownload(
    downloadUrl.value,
    { filename: apkSavePath, timeout: 300, retry: 1 },
    (download, status) => {
      if (status === 200 && download.filename) {
        downloading.value = false
        downloadProgress.value = 100
        installing.value = true

        plus.runtime.install(
          download.filename,
          { force: false },
          () => {
            resetUpdateLoading()
            uni.showToast({ title: '更新完成，正在重启', icon: 'none' })
            setTimeout(() => {
              plus.runtime.restart()
            }, 1500)
          },
          (err: any) => {
            resetUpdateLoading()
            console.error('安装更新失败:', err)
            uni.showToast({ title: '安装更新失败，请手动安装', icon: 'none' })
          },
        )
      } else {
        resetUpdateLoading()
        console.error('下载更新包失败，状态码:', status)
        uni.showToast({ title: '更新包下载失败，请检查网络重试', icon: 'none' })
      }
    },
  )

  downloadTask.addEventListener('statechanged', (task: any) => {
    if (task.state === 3 && task.totalSize > 0) {
      downloadProgress.value = Math.round((task.downloadedSize / task.totalSize) * 100)
    }
  })

  downloadTask.start()
  // #endif

  // #ifdef H5 || MP-WEIXIN
  window.open(downloadUrl.value, '_blank')
  // #endif
}

function handleUpdate() {
  if (!downloadUrl.value) {
    uni.showToast({ title: '暂无下载地址', icon: 'none' })
    return
  }
  downloadAndInstallApk()
}

onShow((options) => {
  console.log('App.vue onShow', options)
  const tokenStore = useTokenStore()
  const dictStore = useDictStore()
  const passedAuthGuard = runGlobalAuthGuard(options)
  if (!passedAuthGuard) {
    return
  }
  if (tokenStore.updateNowTime().hasLogin) {
    if (!dictStore.isLoaded) {
      dictStore.loadDictCache()
    }
  }
})

onHide(() => {
  console.log('App 切后台')
})
</script>

<template>
  <!-- 纯原生遮罩弹窗，无uni-ui依赖 -->
  <view v-if="popupOpen" class="mask-layer">
    <view class="update-modal">
      <view class="modal-header">
        <text class="modal-subtitle">APP 更新</text>
        <view class="modal-title">
          {{ updateTitle }}
        </view>
        <view class="version-info">
          <text v-if="localVersion">当前版本 v{{ localVersion }}</text>
          <text v-if="latestVersion">最新版本 v{{ latestVersion }}</text>
        </view>
      </view>

      <view class="modal-content">
        {{ updateContent }}
      </view>

      <view class="progress-panel">
        <view class="progress-track">
          <view class="progress-fill" :style="{ width: `${downloadProgress}%` }" />
        </view>
        <text class="progress-label">
          {{ updateProgressText }}
        </text>
      </view>

      <view class="modal-footer">
        <text v-if="forceUpdate" class="force-tip">当前版本不可继续使用，请更新 APP</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.mask-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.update-modal {
  width: 620rpx;
  padding: 36rpx 32rpx 32rpx;
  border-radius: 18rpx;
  background: #ffffff;
}
.modal-header {
  padding-bottom: 22rpx;
  border-bottom: 1rpx solid #edf2f8;
}
.modal-subtitle {
  color: #2f7dff;
  font-size: 25rpx;
  font-weight: bold;
}
.modal-title {
  margin-top: 12rpx;
  color: #172033;
  font-size: 38rpx;
  font-weight: bold;
  line-height: 1.35;
}
.version-info {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 14rpx;
  color: #7a8799;
  font-size: 24rpx;
}
.modal-content {
  min-height: 150rpx;
  padding: 28rpx 0;
  color: #344054;
  font-size: 28rpx;
  line-height: 1.7;
  white-space: pre-wrap;
}
.progress-panel {
  margin-bottom: 26rpx;
}
.progress-track {
  width: 100%;
  height: 16rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #edf2f8;
}
.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: #2f7dff;
  transition: width 0.2s ease;
}
.progress-label {
  display: block;
  margin-top: 12rpx;
  color: #667085;
  font-size: 24rpx;
  text-align: center;
}
.force-tip {
  display: block;
  margin-bottom: 18rpx;
  color: #f56c6c;
  font-size: 24rpx;
  text-align: center;
}
.btn-group {
  display: flex;
  width: 100%;
  gap: 20rpx;
}
.btn-cancel,
.btn-primary {
  flex: 1;
  height: 88rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  line-height: 88rpx;
}
.btn-cancel {
  color: #667085;
  background: #f2f4f7;
}
.btn-primary {
  color: #fff;
  background: #2f7dff;
}
</style>
