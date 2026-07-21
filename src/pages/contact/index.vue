<template>
  <view class="yd-page-container category-page">
    <wd-navbar title="人员管理" placeholder safe-area-inset-top fixed />

    <scroll-view scroll-y class="category-scroll">
      <view class="category-content">
        <view class="category-header">
          <view class="header-icon">
            <wd-icon name="user-group" size="44rpx" color="#2f7dff" />
          </view>
          <view class="header-copy">
            <view class="header-title">
              人员管理
            </view>
            <view class="header-subtitle">
              维护外呼人员、角色、业务类型与网格范围
            </view>
          </view>
        </view>

        <view class="menu-list">
          <view v-for="menu in menus" :key="menu.key" class="menu-row" @click="navigateToMenu(menu)">
            <view class="row-icon" :style="getIconStyle(menu)">
              <wd-icon :name="menu.icon" size="38rpx" :color="menu.iconColor || '#2f7dff'" />
            </view>
            <view class="row-copy">
              <view class="row-title">
                {{ menu.name }}
              </view>
              <view class="row-desc">
                账号、角色、电话、业务范围统一维护
              </view>
            </view>
            <wd-icon name="arrow-right" size="28rpx" color="#94a3b8" />
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { MenuItem } from '@/pages/index'
import { computed } from 'vue'
import { getMenuGroups, useMenuNavigate } from '@/pages/index'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { navigateToMenu } = useMenuNavigate()
const menus = computed(() => getMenuGroups().find(group => group.key === 'personnel')?.menus || [])

function getIconStyle(menu: MenuItem) {
  return { backgroundColor: menu.iconColor ? `${menu.iconColor}14` : '#eef5ff' }
}
</script>

<style scoped lang="scss">
.category-page {
  min-height: 100vh;
  background: #f3f6fb;
}

.category-scroll {
  min-height: 0;
  flex: 1;
}

.category-content {
  padding: 24rpx;
}

.category-header,
.menu-row {
  border: 1rpx solid #e3ebf7;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 10rpx 28rpx rgba(47, 125, 255, 0.07);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 26rpx;
}

.header-icon,
.row-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 18rpx;
  background: #eef5ff;
}

.header-icon {
  width: 82rpx;
  height: 82rpx;
}

.header-copy,
.row-copy {
  min-width: 0;
  flex: 1;
}

.header-title {
  color: #0b2b5c;
  font-size: 36rpx;
  font-weight: 800;
}

.header-subtitle,
.row-desc {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 24rpx;
}

.menu-list {
  display: grid;
  gap: 14rpx;
  margin-top: 20rpx;
  padding-bottom: 48rpx;
}

.menu-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 112rpx;
  padding: 20rpx;
}

.row-icon {
  width: 72rpx;
  height: 72rpx;
}

.row-title {
  color: #0b2b5c;
  font-size: 30rpx;
  font-weight: 750;
}
</style>
