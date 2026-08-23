<template>
  <view class="video-preview-page">
    <wd-navbar title="凭证视频" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <view class="video-preview-body">
      <video
        v-if="videoUrl"
        :src="videoUrl"
        class="video-preview-player"
        controls
        autoplay
        object-fit="contain"
        show-center-play-btn
        show-fullscreen-btn
        @error="handleVideoError"
      />
      <view v-else class="video-preview-empty">
        视频地址为空
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed } from 'vue'

const props = defineProps<{
  url?: string
}>()

const CERTIFICATE_VIDEO_PREVIEW_URL_KEY = 'business:certificate-preview-video-url'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const videoUrl = computed(() => {
  const routeUrl = props.url || ''
  const storageUrl = String(uni.getStorageSync(CERTIFICATE_VIDEO_PREVIEW_URL_KEY) || '')
  return safeDecodeUrl(routeUrl || storageUrl)
})

function safeDecodeUrl(url: string) {
  try {
    return decodeURIComponent(url)
  } catch {
    return url
  }
}

function handleBack() {
  uni.navigateBack()
}

function handleVideoError() {
  toast.error('视频加载失败')
}
</script>

<style lang="scss" scoped>
.video-preview-page {
  min-height: 100vh;
  background: #0f172a;
}

.video-preview-body {
  display: flex;
  min-height: calc(100vh - 88rpx);
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  box-sizing: border-box;
}

.video-preview-player {
  width: 100%;
  max-height: calc(100vh - 160rpx);
  background: #000;
}

.video-preview-empty {
  color: #fff;
  font-size: 28rpx;
}
</style>
