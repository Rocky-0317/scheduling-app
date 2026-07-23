<script setup lang="ts">
withDefaults(defineProps<{
  loading?: boolean
  text?: string
}>(), {
  loading: true,
  text: '正在校验登录状态',
})
</script>

<template>
  <view v-if="loading" class="auth-page-loading">
    <wd-loading />
    <text class="auth-page-loading__text">
      {{ text }}
    </text>
  </view>
  <slot v-else />
</template>

<style scoped lang="scss">
.auth-page-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20rpx;
  background: #f7f8fa;
}

.auth-page-loading__text {
  color: #667085;
  font-size: 28rpx;
}
</style>
