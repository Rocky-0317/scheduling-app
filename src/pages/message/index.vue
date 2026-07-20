<template>
  <view class="yd-page-container category-page">
    <wd-navbar title="门店业务" placeholder safe-area-inset-top fixed />

    <scroll-view scroll-y class="category-scroll">
      <view class="category-content">
        <view class="category-header">
          <view>
            <view class="header-title">
              门店业务
            </view>
            <view class="header-subtitle">
              套餐、客户、门店资料统一管理
            </view>
          </view>
          <view class="header-badge">
            {{ menus.length }} 项
          </view>
        </view>

        <view class="store-grid">
          <view v-for="menu in menus" :key="menu.key" class="store-card" @click="navigateToMenu(menu)">
            <view class="store-icon" :style="getIconStyle(menu)">
              <wd-icon :name="menu.icon" size="42rpx" :color="menu.iconColor || '#0f766e'" />
            </view>
            <view class="store-title">
              {{ menu.name }}
            </view>
            <view class="store-desc">
              {{ getDesc(menu.key) }}
            </view>
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
const menus = computed(() => getMenuGroups().find(group => group.key === 'offlineStore')?.menus || [])

function getIconStyle(menu: MenuItem) {
  return { backgroundColor: menu.iconColor ? `${menu.iconColor}14` : '#eef8f6' }
}

function getDesc(key: string) {
  const map: Record<string, string> = {
    bizPackage: '套餐名称、编码、价格维护',
    customerInfo: '客户线索与办理套餐信息',
    storeList: '查看线下门店列表',
    storeInfo: '查看门店基础资料',
  }
  return map[key] || '进入门店业务'
}
</script>

<style scoped lang="scss">
.category-page {
  min-height: 100vh;
  background: #f4f7f6;
}

.category-scroll {
  min-height: 0;
  flex: 1;
}

.category-content {
  padding: 24rpx;
}

.category-header,
.store-card {
  border: 1rpx solid #e2ebe8;
  border-radius: 8rpx;
  background: #fff;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.04);
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 26rpx;
}

.header-title {
  color: #0f172a;
  font-size: 36rpx;
  font-weight: 800;
}

.header-subtitle {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 24rpx;
}

.header-badge {
  flex-shrink: 0;
  padding: 8rpx 14rpx;
  border-radius: 8rpx;
  color: #0f766e;
  background: #effaf7;
  font-size: 23rpx;
  font-weight: 700;
}

.store-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 20rpx;
  padding-bottom: 48rpx;
}

.store-card {
  min-height: 176rpx;
  padding: 22rpx;
}

.store-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 8rpx;
}

.store-title {
  margin-top: 16rpx;
  color: #111827;
  font-size: 29rpx;
  font-weight: 750;
}

.store-desc {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 23rpx;
  line-height: 1.35;
}
</style>
