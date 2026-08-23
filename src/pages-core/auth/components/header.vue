<template>
  <view class="header">
    <view class="brand-row">
      <view class="logo-shell">
        <wd-img src="/static/logo.svg" width="84rpx" height="84rpx" mode="aspectFit" />
      </view>
      <view class="brand-copy">
        <view class="brand-title">
          {{ title || '配送调度系统' }}
        </view>
        <view class="brand-subtitle">
          外呼分发、网格协同、超时闭环
        </view>
      </view>
    </view>
    <view class="process-strip">
      <text>记录</text>
      <view />
      <text>分发</text>
      <view />
      <text>领取</text>
      <view />
      <text>完成</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
const title = import.meta.env.VITE_APP_TITLE
</script>

<style lang="scss" scoped>
.header {
  position: relative;
  z-index: 1;
  padding: 92rpx 32rpx 24rpx;
}

.brand-row {
  display: flex;
  align-items: center;
}

.logo-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 104rpx;
  height: 104rpx;
  flex-shrink: 0;
  margin-right: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.82);
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 16rpx 34rpx rgba(47, 125, 255, 0.12);
}

.brand-copy {
  min-width: 0;
  flex: 1;
}

.brand-title {
  overflow: hidden;
  color: #0b2b5c;
  font-size: 42rpx;
  font-weight: 900;
  line-height: 1.16;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-subtitle {
  margin-top: 12rpx;
  color: #64748b;
  font-size: 24rpx;
}

.process-strip {
  display: flex;
  align-items: center;
  margin-top: 28rpx;
  padding: 18rpx 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.78);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 12rpx 28rpx rgba(47, 125, 255, 0.08);

  text {
    color: #0b2b5c;
    font-size: 23rpx;
    font-weight: 750;
  }

  view {
    height: 2rpx;
    flex: 1;
    margin: 0 12rpx;
    background: #c8d9f3;
  }
}
</style>
