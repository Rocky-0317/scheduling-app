<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { onMounted, onUnmounted, ref } from 'vue'
import { useDictStore, useTokenStore } from '@/store'

interface UpdatePopupParams {
  latestVersion?: string
  localVersion?: string
  updateTitle?: string
  updateContent?: string
  downloadUrl?: string
  forceUpdate?: boolean
  onSkip?: () => void
}

const popupOpen = ref(false)
const latestVersion = ref('')
const localVersion = ref('')
const updateTitle = ref('发现新版本')
const updateContent = ref('请更新到最新版本后继续使用')
const downloadUrl = ref('')
const forceUpdate = ref(false)
let skipUpdateHandler: (() => void) | undefined

function syncTabbarWhenPageVisible() {}

onLaunch((options) => {
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
    skipUpdateHandler = params.onSkip
    setTimeout(() => {
      popupOpen.value = true
      console.log('弹窗开关已置为true', popupOpen.value)
    }, 100)
  })

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

function closePopup() {
  if (forceUpdate.value)
    return
  skipUpdateHandler?.()
  popupOpen.value = false
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
  if (tokenStore.hasLogin) {
    if (!dictStore.isLoaded) {
      dictStore.loadDictCache()
    }
    tokenStore.checkAppUpdate()
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

      <view class="modal-footer">
        <text v-if="forceUpdate" class="force-tip">当前版本不可继续使用，请更新 APP</text>
        <view class="btn-group">
          <button v-if="!forceUpdate" class="btn-cancel" @click="closePopup">
            稍后再说
          </button>
          <button class="btn-primary" @click="handleUpdate">
            立即更新
          </button>
        </view>
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
