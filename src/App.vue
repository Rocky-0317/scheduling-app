<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { navigateToInterceptor } from '@/router/interceptor'
import { useDictStore, useTokenStore } from '@/store'
import type { SysNotice } from '@/api/system/notice'
import { getNotice, markNoticeRead } from '@/api/system/notice'

const unreadNoticeDialog = ref(false)
const unreadNoticeArr = ref<SysNotice[]>([])
const currentUnreadNotice = ref<SysNotice>({} as SysNotice)
const noticeReadLoading = ref(false)
let unreadIndex = 0

const needUpdate = ref(false)
const latestVersion = ref('')
const downloadUrl = ref('')
const forceUpdate = ref(false)

const hasCurrentUnreadContent = computed(() => {
  const content = currentUnreadNotice.value.noticeContent
  if (content == null)
    return false
  const text = String(content).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  return text !== '' || /<img\b/i.test(String(content))
})

async function getUnreadNoticeDetail(notice: SysNotice) {
  if (!notice.noticeId)
    return notice
  if (notice.noticeContent && String(notice.noticeContent).trim() !== '')
    return notice
  const res = await getNotice(notice.noticeId)
  return { ...notice, ...res }
}

onLaunch((options) => {
  console.log('App初始化', options)
  uni.$on('app:openUnreadNoticePopup', async (params) => {
    console.log('收到弹窗事件参数', params)
    unreadNoticeArr.value = params.noticeList ?? []
    needUpdate.value = params.needUpdate ?? false
    latestVersion.value = params.latestVersion ?? ''
    downloadUrl.value = params.downloadUrl ?? ''
    forceUpdate.value = params.forceUpdate ?? false
    unreadIndex = 0

    if (unreadNoticeArr.value.length) {
      currentUnreadNotice.value = await getUnreadNoticeDetail(unreadNoticeArr.value[unreadIndex])
    } else {
      currentUnreadNotice.value = {} as SysNotice
    }

    nextTick(() => {
      unreadNoticeDialog.value = true
      console.log('弹窗开关已打开', unreadNoticeDialog.value)
    })
  })
})

onMounted(() => {
  // #ifdef H5
  function syncTabbarWhenPageVisible() {}
  document.addEventListener('visibilitychange', syncTabbarWhenPageVisible)
  window.addEventListener('pageshow', syncTabbarWhenPageVisible)
  // #endif
})

onUnmounted(() => {
  uni.$off('app:openUnreadNoticePopup')
  // #ifdef H5
  document.removeEventListener('visibilitychange', syncTabbarWhenPageVisible)
  window.removeEventListener('pageshow', syncTabbarWhenPageVisible)
  // #endif
})

async function closeUnreadNotice() {
  if (noticeReadLoading.value)
    return
  if (forceUpdate.value)
    return
  const noticeId = currentUnreadNotice.value.noticeId
  if (!noticeId) {
    unreadNoticeDialog.value = false
    return
  }

  noticeReadLoading.value = true
  try {
    await markNoticeRead(noticeId)
    unreadNoticeDialog.value = false
    unreadIndex++

    if (unreadIndex < unreadNoticeArr.value.length) {
      currentUnreadNotice.value = await getUnreadNoticeDetail(unreadNoticeArr.value[unreadIndex])
      setTimeout(() => {
        nextTick(() => {
          unreadNoticeDialog.value = true
        })
      }, 180)
    }
  } finally {
    noticeReadLoading.value = false
  }
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
  if (tokenStore.updateNowTime().hasLogin && !dictStore.isLoaded) {
    void dictStore.loadDictCacheWithRetry()
  }
  if (options?.path) {
    navigateToInterceptor.invoke({ url: `/${options.path}`, query: options.query })
  } else {
    navigateToInterceptor.invoke({ url: '/' })
  }
  // tabbarStore.syncTabbarWhenPageAsync() 方法不存在已注释
})

onHide(() => {
  console.log('App 切后台')
})
</script>

<template>
  <uni-popup
    v-model="unreadNoticeDialog"
    type="center"
    :mask-close="false"
    style="z-index: 9999999 !important;"
  >
    <view class="notice-wrap">
      <view class="notice-popup-header">
        <view>
          <view class="notice-popup-label">
            <text>🔔</text>
            <text>公告提醒</text>
          </view>
          <text class="notice-popup-title">{{ currentUnreadNotice.noticeTitle || '未命名公告' }}</text>
        </view>
        <view v-if="unreadNoticeArr.length > 1" class="notice-tag">
          {{ unreadIndex + 1 }}/{{ unreadNoticeArr.length }}
        </view>
      </view>

      <view class="notice-popup-meta">
        <text>{{ currentUnreadNotice.createBy || '系统' }}</text>
        <text>{{ currentUnreadNotice.createTime || '-' }}</text>
        <text v-if="needUpdate" class="update-tip">
          {{ forceUpdate ? '【强制更新】' : '' }}发现新版本 v{{ latestVersion }}
        </text>
      </view>

      <scroll-view scroll-y class="notice-popup-scroll">
        <view v-if="hasCurrentUnreadContent" class="notice-popup-content">
          <div v-html="currentUnreadNotice.noticeContent" />
        </view>
        <view v-else class="empty-tip">
          暂无公告详情
        </view>
      </scroll-view>

      <view class="notice-popup-footer">
        <text v-if="!forceUpdate" class="notice-popup-tip">确认后标记本条公告已读</text>
        <text v-if="forceUpdate" class="force-tip">当前版本已停用，请更新APP</text>

        <view v-if="needUpdate" class="btn-row">
          <button v-if="!forceUpdate" class="btn-cancel" :disabled="noticeReadLoading" @click="closeUnreadNotice">
            稍后再说
          </button>
          <button class="btn-update" :disabled="noticeReadLoading" @click="handleUpdate">
            立即更新
          </button>
        </view>

        <button v-else class="notice-btn" :disabled="noticeReadLoading" @click="closeUnreadNotice">
          {{ noticeReadLoading ? '处理中...' : unreadIndex + 1 < unreadNoticeArr.length ? '已知晓，下一条' : '我知道了' }}
        </button>
      </view>
    </view>
  </uni-popup>
</template>

<style lang="scss">
.notice-wrap {
  width: 620rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
}
.notice-popup-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}
.notice-popup-label {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin-bottom: 8rpx;
  color: #409eff;
  font-size: 26rpx;
  font-weight: 600;
}
.notice-popup-title {
  color: #333;
  font-size: 36rpx;
  font-weight: 700;
  line-height: 1.45;
  word-break: break-word;
}
.notice-tag {
  background: #e8f4ff;
  color: #409eff;
  font-size: 24rpx;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
}
.notice-popup-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin: 12rpx 0;
  color: #999;
  font-size: 24rpx;
}
.update-tip {
  color: #f56c6c;
}
.force-tip {
  display: block;
  text-align: center;
  color: #f56c6c;
  font-size: 24rpx;
  margin-bottom: 16rpx;
}
.notice-popup-scroll {
  min-height: 360rpx;
  max-height: 600rpx;
}
.notice-popup-content {
  color: #333;
  font-size: 28rpx;
  line-height: 1.8;
  word-break: break-word;
  overflow-x: auto;
  div {
    width: 100%;
  }
}
.empty-tip {
  text-align: center;
  color: #999;
  padding: 40rpx 0;
  font-size: 26rpx;
}
.notice-popup-tip {
  display: block;
  text-align: center;
  color: #999;
  font-size: 24rpx;
  margin-bottom: 16rpx;
}
.notice-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #409eff;
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
  border: none;
}
.btn-row {
  display: flex;
  gap: 20rpx;
  width: 100%;
}
.btn-cancel {
  flex: 1;
  height: 88rpx;
  background: #eee;
  color: #666;
  border-radius: 12rpx;
  font-size: 30rpx;
  border: none;
}
.btn-update {
  flex: 1;
  height: 88rpx;
  background: #f56c6c;
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
  border: none;
}
.notice-btn[disabled],
.btn-cancel[disabled],
.btn-update[disabled] {
  opacity: 0.6;
}
</style>
