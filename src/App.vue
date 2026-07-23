<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { onMounted, onUnmounted, ref } from 'vue'
import { navigateToInterceptor } from '@/router/interceptor'
import { useDictStore, useTokenStore } from '@/store'
import { hasTokenInfo, isAccessTokenExpired } from '@/utils/auth'

interface UpdatePopupParams {
  latestVersion?: string
  localVersion?: string
  updateTitle?: string
  updateContent?: string
  downloadUrl?: string
  forceUpdate?: boolean
  onSkip?: () => void
}

const updateDialog = ref(false)
const latestVersion = ref('')
const localVersion = ref('')
const updateTitle = ref('发现新版本')
const updateContent = ref('请更新到最新版本后继续使用')
const downloadUrl = ref('')
const forceUpdate = ref(false)
let skipUpdateHandler: (() => void) | undefined

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
  navigateToInterceptor.invoke({ url, query: options?.query })
  return true
}

onLaunch((options) => {
  runGlobalAuthGuard(options)
  console.log('App初始化', options)
  uni.$on('app:openUpdatePopup', (params: UpdatePopupParams = {}) => {
    latestVersion.value = params.latestVersion || ''
    localVersion.value = params.localVersion || ''
    updateTitle.value = params.updateTitle || '发现新版本'
    updateContent.value = params.updateContent || '请更新到最新版本后继续使用'
    downloadUrl.value = params.downloadUrl || ''
    forceUpdate.value = Boolean(params.forceUpdate)
    skipUpdateHandler = params.onSkip
    updateDialog.value = true
  })
})

onMounted(() => {
  // #ifdef H5
  document.addEventListener('visibilitychange', syncTabbarWhenPageVisible)
  window.addEventListener('pageshow', syncTabbarWhenPageVisible)
  // #endif
})

onUnmounted(() => {
  uni.$off('app:openUpdatePopup')
  // #ifdef H5
  document.removeEventListener('visibilitychange', syncTabbarWhenPageVisible)
  window.removeEventListener('pageshow', syncTabbarWhenPageVisible)
  // #endif
})

function closeUpdatePopup() {
  if (forceUpdate.value) {
    return
  }
  skipUpdateHandler?.()
  updateDialog.value = false
}

function handleUpdate() {
  if (!downloadUrl.value) {
    uni.showToast({ title: '暂无下载地址', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/pages/common/webview?url=${encodeURIComponent(downloadUrl.value)}`,
  })
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
      void dictStore.loadDictCacheWithRetry()
    }
    void tokenStore.checkAppUpdate()
  }
})

onHide(() => {
  console.log('App 切后台')
})
</script>

<template>
  <uni-popup
    v-model="updateDialog"
    type="center"
    :mask-close="false"
    style="z-index: 9999999 !important;"
  >
    <view class="update-wrap">
      <view class="update-header">
        <view class="update-label">
          APP 更新
        </view>
        <view class="update-title">
          {{ updateTitle }}
        </view>
        <view class="update-version">
          <text v-if="localVersion">当前版本 v{{ localVersion }}</text>
          <text v-if="latestVersion">最新版本 v{{ latestVersion }}</text>
        </view>
      </view>

      <view class="update-content">
        {{ updateContent }}
      </view>

      <view class="update-footer">
        <text v-if="forceUpdate" class="force-tip">当前版本不可继续使用，请更新 APP</text>
        <view class="btn-row">
          <button v-if="!forceUpdate" class="btn-cancel" @click="closeUpdatePopup">
            稍后再说
          </button>
          <button class="btn-update" @click="handleUpdate">
            立即更新
          </button>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<style lang="scss">
.update-wrap {
  width: 620rpx;
  padding: 36rpx 32rpx 32rpx;
  border-radius: 18rpx;
  background: #fff;
}

.update-header {
  padding-bottom: 22rpx;
  border-bottom: 1rpx solid #edf2f8;
}

.update-label {
  color: #2f7dff;
  font-size: 25rpx;
  font-weight: 700;
}

.update-title {
  margin-top: 12rpx;
  color: #172033;
  font-size: 38rpx;
  font-weight: 800;
  line-height: 1.35;
}

.update-version {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 14rpx;
  color: #7a8799;
  font-size: 24rpx;
}

.update-content {
  min-height: 150rpx;
  padding: 28rpx 0;
  color: #344054;
  font-size: 28rpx;
  line-height: 1.7;
  white-space: pre-wrap;
}

.force-tip {
  display: block;
  margin-bottom: 18rpx;
  color: #f56c6c;
  font-size: 24rpx;
  text-align: center;
}

.btn-row {
  display: flex;
  width: 100%;
  gap: 20rpx;
}

.btn-cancel,
.btn-update {
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

.btn-update {
  color: #fff;
  background: #2f7dff;
}
</style>
