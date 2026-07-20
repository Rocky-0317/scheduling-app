<template>
  <view class="header">
    <view class="brand-row">
      <view class="logo-shell">
        <wd-img src="/static/logo.svg" width="96rpx" height="96rpx" mode="aspectFit" />
      </view>
      <view class="brand-copy">
        <view class="brand-title">
          {{ title }}
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
const title = import.meta.env.VITE_APP_TITLE // 应用标题
</script>

<style lang="scss" scoped>
.header {
  padding: 92rpx 32rpx 28rpx;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.logo-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 112rpx;
  height: 112rpx;
  flex-shrink: 0;
  border: 1rpx solid rgba(15, 118, 110, 0.12);
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 14rpx 34rpx rgba(15, 118, 110, 0.16);
}

.brand-copy {
  min-width: 0;
  flex: 1;
}

.brand-title {
  color: #0f172a;
  font-size: 44rpx;
  font-weight: 800;
  line-height: 1.16;
}

.brand-subtitle {
  margin-top: 12rpx;
  color: #475569;
  font-size: 25rpx;
}

.process-strip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 30rpx;
  padding: 18rpx 20rpx;
  border: 1rpx solid #d9ebe7;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.74);

  text {
    color: #0f766e;
    font-size: 23rpx;
    font-weight: 650;
  }

  view {
    height: 2rpx;
    flex: 1;
    background: #99d5ca;
  }
}
</style>
