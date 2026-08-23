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
              <view v-if="isStoreIcon(menu)" class="store-mark" :style="{ '--store-color': menu.iconColor || '#2f7dff' }">
                <view class="store-mark__awning" />
                <view class="store-mark__body">
                  <view />
                  <view />
                </view>
              </view>
              <view v-else-if="isPackageIcon(menu)" class="package-mark" :style="{ '--package-color': menu.iconColor || '#dc2626' }">
                <view class="package-mark__box" />
                <view class="package-mark__lid" />
                <view class="package-mark__tape" />
              </view>
              <wd-icon v-else :name="menu.icon" size="42rpx" :color="menu.iconColor || '#2f7dff'" />
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
  return { backgroundColor: menu.iconColor ? `${menu.iconColor}14` : '#eef5ff' }
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

function isStoreIcon(menu: MenuItem) {
  return menu.key === 'storeList' || menu.icon === 'shop'
}

function isPackageIcon(menu: MenuItem) {
  return menu.key === 'bizPackage'
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
.store-card {
  border: 1rpx solid #e3ebf7;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 10rpx 28rpx rgba(47, 125, 255, 0.07);
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 26rpx;
}

.category-header > view:first-child {
  min-width: 0;
  margin-right: 20rpx;
}

.header-title {
  color: #0b2b5c;
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
  color: #2f7dff;
  background: #eef5ff;
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

.store-mark {
  position: relative;
  width: 44rpx;
  height: 40rpx;
}

.store-mark__awning {
  position: absolute;
  left: 2rpx;
  top: 0;
  width: 40rpx;
  height: 14rpx;
  border: 4rpx solid var(--store-color);
  border-bottom: 0;
  border-radius: 8rpx 8rpx 3rpx 3rpx;
}

.store-mark__awning::before,
.store-mark__awning::after {
  position: absolute;
  top: 0;
  bottom: -2rpx;
  width: 4rpx;
  background: var(--store-color);
  content: '';
}

.store-mark__awning::before {
  left: 12rpx;
}

.store-mark__awning::after {
  right: 12rpx;
}

.store-mark__body {
  position: absolute;
  left: 6rpx;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  width: 32rpx;
  height: 24rpx;
  padding: 7rpx 6rpx 0;
  border: 4rpx solid var(--store-color);
  border-radius: 3rpx;
  box-sizing: border-box;
}

.store-mark__body view {
  width: 6rpx;
  height: 13rpx;
  background: var(--store-color);
}

.package-mark {
  position: relative;
  width: 44rpx;
  height: 42rpx;
}

.package-mark__box {
  position: absolute;
  left: 4rpx;
  bottom: 0;
  width: 36rpx;
  height: 28rpx;
  border: 4rpx solid var(--package-color);
  border-radius: 5rpx;
  box-sizing: border-box;
}

.package-mark__lid {
  position: absolute;
  left: 0;
  top: 3rpx;
  width: 44rpx;
  height: 13rpx;
  border: 4rpx solid var(--package-color);
  border-radius: 5rpx;
  box-sizing: border-box;
}

.package-mark__tape {
  position: absolute;
  left: 19rpx;
  top: 5rpx;
  width: 6rpx;
  height: 35rpx;
  border-radius: 999rpx;
  background: var(--package-color);
}

.store-title {
  margin-top: 16rpx;
  color: #0b2b5c;
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
