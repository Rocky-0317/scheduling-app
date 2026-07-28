<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { onMounted, onUnmounted, ref } from 'vue'
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
const downloading = ref(false)
const downloadProgress = ref(0)
const decompressing = ref(false)

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
    skipUpdateHandler = params.onSkip
    setTimeout(() => {
      popupOpen.value = true
      console.log('弹窗开关已置为true', popupOpen.value)
      handleUpdate()
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
  if (forceUpdate.value || downloading.value || decompressing.value)
    return
  skipUpdateHandler?.()
  popupOpen.value = false
}

function findApkInDir(dirEntry: any): string | null {
  const entries = dirEntry.createReader().readEntriesSync()
  for (const entry of entries) {
    if (entry.isFile && entry.name.toLowerCase().endsWith('.apk')) {
      return entry.fullPath
    }
    if (entry.isDirectory) {
      const apkPath = findApkInDir(entry)
      if (apkPath)
        return apkPath
    }
  }
  return null
}

function resetUpdateLoading() {
  downloading.value = false
  decompressing.value = false
}

function findApkAndInstall(dirPath: string) {
  // #ifdef APP-PLUS
  plus.io.resolveLocalFileSystemURL(
    dirPath,
    (dirEntry: any) => {
      try {
        const apkPath = findApkInDir(dirEntry)
        if (apkPath) {
          resetUpdateLoading()
          console.log('找到APK，开始安装：', apkPath)
          plus.runtime.install(
            apkPath,
            { force: false },
            () => {
              uni.showToast({ title: '安装包已启动，请完成安装', icon: 'none' })
            },
            (err: any) => {
              console.error('安装失败：', err)
              uni.showToast({ title: '安装启动失败，请手动安装', icon: 'none' })
            },
          )
        } else {
          resetUpdateLoading()
          uni.showToast({ title: '压缩包内未找到安装文件', icon: 'none' })
        }
      } catch (e) {
        resetUpdateLoading()
        console.error('遍历目录失败：', e)
        uni.showToast({ title: '解析安装包失败', icon: 'none' })
      }
    },
    (err: any) => {
      resetUpdateLoading()
      console.error('打开解压目录失败：', err)
      uni.showToast({ title: '解压目录无效', icon: 'none' })
    },
  )
  // #endif
}

function removeOldExtractDir(dirPath: string): Promise<void> {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    plus.io.resolveLocalFileSystemURL(
      dirPath,
      (entry: any) => {
        entry.removeRecursively(() => resolve(), () => resolve())
      },
      () => resolve(),
    )
    // #endif
    // #ifndef APP-PLUS
    resolve()
    // #endif
  })
}

function handleUpdate() {
  if (!downloadUrl.value) {
    uni.showToast({ title: '暂无下载地址', icon: 'none' })
    return
  }
  if (downloading.value || decompressing.value)
    return

  // #ifdef APP-PLUS
  downloading.value = true
  downloadProgress.value = 0

  const zipSavePath = '_downloads/app_update.zip'
  const extractTargetDir = '_downloads/app_update/'

  removeOldExtractDir(extractTargetDir).then(() => {
    const downloadTask = plus.downloader.createDownload(
      downloadUrl.value,
      { filename: zipSavePath, timeout: 300, retry: 1 },
      (download, status) => {
        if (status === 200 && download.filename) {
          console.log('ZIP下载完成，开始解压：', download.filename)
          decompressing.value = true

          plus.zip.decompress(
            download.filename,
            extractTargetDir,
            () => {
              console.log('解压成功，查找APK')
              findApkAndInstall(extractTargetDir)
            },
            (err: any) => {
              resetUpdateLoading()
              console.error('解压失败：', err)
              uni.showToast({ title: '安装包解压失败，请重试', icon: 'none' })
            },
          )
        } else {
          resetUpdateLoading()
          console.error('下载失败，状态码：', status)
          uni.showToast({ title: '下载失败，请检查网络重试', icon: 'none' })
        }
      },
    )

    downloadTask.addEventListener('statechanged', (task: any) => {
      if (task.state === 3 && task.totalSize > 0) {
        downloadProgress.value = Math.round((task.downloadedSize / task.totalSize) * 100)
      }
    })

    downloadTask.start()
  })
  // #endif

  // #ifdef H5 || MP-WEIXIN
  window.open(downloadUrl.value, '_blank')
  // #endif
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
          <button v-if="!forceUpdate" class="btn-cancel" :disabled="downloading || decompressing" @click="closePopup">
            稍后再说
          </button>
          <button class="btn-primary" :disabled="downloading || decompressing" @click="handleUpdate">
            <template v-if="downloading">
              下载中 {{ downloadProgress }}%
            </template>
            <template v-else-if="decompressing">
              解压安装包...
            </template>
            <template v-else>
              重新下载
            </template>
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
