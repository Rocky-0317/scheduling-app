<template>
  <view class="yd-page-container category-page">
    <wd-navbar title="调度业务" placeholder safe-area-inset-top fixed />

    <scroll-view scroll-y class="category-scroll">
      <view class="category-content">
        <view class="category-header">
          <view>
            <view class="header-kicker">
              Dispatch
            </view>
            <view class="header-title">
              调度业务
            </view>
            <view class="header-subtitle">
              外呼、分发、网格、超时任务集中处理
            </view>
          </view>
          <wd-img src="/static/logo.svg" width="84rpx" height="84rpx" mode="aspectFit" />
        </view>

        <view class="shortcut-grid">
          <view v-for="menu in primaryMenus" :key="menu.key" class="shortcut-card" @click="navigateToMenu(menu)">
            <view class="shortcut-icon" :style="getIconStyle(menu)">
              <view v-if="isAssignmentIcon(menu)" class="flow-mark" :style="{ '--mark-color': menu.iconColor || '#4f46e5' }">
                <view class="flow-node node-start" />
                <view class="flow-node node-mid" />
                <view class="flow-node node-end" />
                <view class="flow-line line-one" />
                <view class="flow-line line-two" />
              </view>
              <view v-else-if="isTimeoutIcon(menu)" class="timeout-mark" :style="{ '--mark-color': menu.iconColor || '#d97706' }">
                <view class="timeout-face">
                  <view class="timeout-hand hand-hour" />
                  <view class="timeout-hand hand-minute" />
                  <view class="timeout-dot" />
                </view>
              </view>
              <wd-icon v-else :name="menu.icon" size="42rpx" :color="menu.iconColor || '#2f7dff'" />
            </view>
            <view class="shortcut-title">
              {{ menu.name }}
            </view>
            <view class="shortcut-desc">
              {{ getDesc(menu.key) }}
            </view>
          </view>
        </view>

        <view class="section-title">
          全部调度功能
        </view>
        <view class="menu-list">
          <view v-for="menu in menus" :key="menu.key" class="menu-row" @click="navigateToMenu(menu)">
            <view class="row-icon" :style="getIconStyle(menu)">
              <view v-if="isAssignmentIcon(menu)" class="flow-mark flow-mark--small" :style="{ '--mark-color': menu.iconColor || '#4f46e5' }">
                <view class="flow-node node-start" />
                <view class="flow-node node-mid" />
                <view class="flow-node node-end" />
                <view class="flow-line line-one" />
                <view class="flow-line line-two" />
              </view>
              <view v-else-if="isTimeoutIcon(menu)" class="timeout-mark timeout-mark--small" :style="{ '--mark-color': menu.iconColor || '#d97706' }">
                <view class="timeout-face">
                  <view class="timeout-hand hand-hour" />
                  <view class="timeout-hand hand-minute" />
                  <view class="timeout-dot" />
                </view>
              </view>
              <wd-icon v-else :name="menu.icon" size="36rpx" :color="menu.iconColor || '#2f7dff'" />
            </view>
            <view class="row-copy">
              <view class="row-title">
                {{ menu.name }}
              </view>
              <view class="row-desc">
                {{ getDesc(menu.key) }}
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
const menus = computed(() => getMenuGroups().find(group => group.key === 'dispatch')?.menus || [])
const primaryMenus = computed(() => menus.value.filter(menu => ['outboundRecord', 'assignmentTree', 'timeoutReminder', 'outboundGrid'].includes(menu.key)))

function getIconStyle(menu: MenuItem) {
  return { backgroundColor: menu.iconColor ? `${menu.iconColor}14` : '#eef5ff' }
}

function getDesc(key: string) {
  const map: Record<string, string> = {
    businessWorkbench: '查看今日调度概览',
    outboundRecord: '新增、领取、跟进外呼记录',
    assignmentTree: '查看任务分发链路',
    outboundGrid: '维护网格基础资料',
    timeoutReminder: '处理超时未完成任务',
  }
  return map[key] || '进入业务功能'
}

function isAssignmentIcon(menu: MenuItem) {
  return menu.key === 'assignmentTree'
}

function isTimeoutIcon(menu: MenuItem) {
  return menu.key === 'timeoutReminder'
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

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  padding: 26rpx;
  border: 1rpx solid #dbe8ff;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 14rpx 34rpx rgba(47, 125, 255, 0.08);
}

.header-kicker {
  color: #2f7dff;
  font-size: 22rpx;
  font-weight: 700;
}

.header-title {
  margin-top: 8rpx;
  color: #0b2b5c;
  font-size: 38rpx;
  font-weight: 800;
}

.header-subtitle {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 24rpx;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 20rpx;
}

.shortcut-card,
.menu-row {
  border: 1rpx solid #e3ebf7;
  border-radius: 18rpx;
  background: #fff;
  box-shadow: 0 10rpx 26rpx rgba(47, 125, 255, 0.07);
}

.shortcut-card {
  min-height: 168rpx;
  padding: 22rpx;
}

.shortcut-icon,
.row-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
}

.shortcut-icon {
  width: 72rpx;
  height: 72rpx;
}

.shortcut-title {
  margin-top: 16rpx;
  color: #0b2b5c;
  font-size: 28rpx;
  font-weight: 750;
}

.shortcut-desc,
.row-desc {
  overflow: hidden;
  margin-top: 8rpx;
  color: #64748b;
  font-size: 23rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-title {
  margin: 28rpx 0 16rpx;
  color: #0b2b5c;
  font-size: 30rpx;
  font-weight: 800;
}

.menu-list {
  display: grid;
  gap: 14rpx;
  padding-bottom: 48rpx;
}

.menu-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 104rpx;
  padding: 18rpx;
}

.row-icon {
  width: 70rpx;
  height: 70rpx;
  flex-shrink: 0;
}

.row-copy {
  min-width: 0;
  flex: 1;
}

.row-title {
  color: #0b2b5c;
  font-size: 28rpx;
  font-weight: 700;
}

.flow-mark {
  position: relative;
  width: 46rpx;
  height: 38rpx;
}

.flow-mark--small {
  transform: scale(0.88);
}

.flow-node {
  position: absolute;
  z-index: 2;
  width: 13rpx;
  height: 13rpx;
  border-radius: 50%;
  background: var(--mark-color);
}

.node-start {
  left: 2rpx;
  top: 4rpx;
}

.node-mid {
  left: 17rpx;
  bottom: 2rpx;
}

.node-end {
  right: 2rpx;
  top: 4rpx;
}

.flow-line {
  position: absolute;
  z-index: 1;
  height: 5rpx;
  border-radius: 999rpx;
  background: var(--mark-color);
  opacity: 0.9;
  transform-origin: left center;
}

.line-one {
  left: 11rpx;
  top: 14rpx;
  width: 20rpx;
  transform: rotate(42deg);
}

.line-two {
  left: 27rpx;
  top: 24rpx;
  width: 18rpx;
  transform: rotate(-42deg);
}

.timeout-mark {
  position: relative;
  width: 44rpx;
  height: 44rpx;
}

.timeout-mark--small {
  transform: scale(0.9);
}

.timeout-face {
  position: absolute;
  inset: 3rpx;
  border: 5rpx solid var(--mark-color);
  border-radius: 50%;
}

.timeout-hand {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 4rpx;
  border-radius: 999rpx;
  background: var(--mark-color);
  transform-origin: center bottom;
}

.hand-hour {
  height: 12rpx;
  transform: translate(-50%, -100%) rotate(0deg);
}

.hand-minute {
  height: 16rpx;
  transform: translate(-50%, -100%) rotate(118deg);
}

.timeout-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7rpx;
  height: 7rpx;
  border-radius: 50%;
  background: var(--mark-color);
  transform: translate(-50%, -50%);
}
</style>
