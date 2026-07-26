<template>
  <view class="yd-page-container category-page">
    <wd-navbar
      title="调度业务"
      placeholder
      safe-area-inset-top
      fixed
    />

    <scroll-view scroll-y class="category-scroll">
      <view class="category-content">
        <!-- 顶部介绍 -->
        <view class="category-header">
          <view class="header-copy">
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

          <wd-img
            class="header-logo"
            src="/static/logo.svg"
            width="84rpx"
            height="84rpx"
            mode="aspectFit"
          />
        </view>

        <!-- 快捷入口 -->
        <view class="shortcut-grid">
          <view
            v-for="menu in primaryMenus"
            :key="menu.key"
            class="shortcut-card"
            @click="navigateToMenu(menu)"
          >
            <view
              class="shortcut-icon"
              :style="getIconStyle(menu)"
            >
              <view
                v-if="isAssignmentIcon(menu)"
                class="flow-mark"
                :style="{ '--mark-color': menu.iconColor || '#4f46e5' }"
              >
                <view class="flow-node node-start" />
                <view class="flow-node node-mid" />
                <view class="flow-node node-end" />
                <view class="flow-line line-one" />
                <view class="flow-line line-two" />
              </view>

              <view
                v-else-if="isTimeoutIcon(menu)"
                class="timeout-mark"
                :style="{ '--mark-color': menu.iconColor || '#d97706' }"
              >
                <view class="timeout-face">
                  <view class="timeout-hand hand-hour" />
                  <view class="timeout-hand hand-minute" />
                  <view class="timeout-dot" />
                </view>
              </view>

              <wd-icon
                v-else
                :name="menu.icon"
                size="42rpx"
                :color="menu.iconColor || '#2f7dff'"
              />
            </view>

            <view class="shortcut-title">
              {{ menu.name }}
            </view>

            <view class="shortcut-desc">
              {{ getDesc(menu.key) }}
            </view>
          </view>
        </view>

        <!-- 全部功能 -->
        <view class="section-title">
          全部调度功能
        </view>

        <view class="menu-list">
          <view
            v-for="menu in menus"
            :key="menu.key"
            class="menu-row"
            @click="navigateToMenu(menu)"
          >
            <view
              class="row-icon"
              :style="getIconStyle(menu)"
            >
              <view
                v-if="isAssignmentIcon(menu)"
                class="flow-mark flow-mark--small"
                :style="{ '--mark-color': menu.iconColor || '#4f46e5' }"
              >
                <view class="flow-node node-start" />
                <view class="flow-node node-mid" />
                <view class="flow-node node-end" />
                <view class="flow-line line-one" />
                <view class="flow-line line-two" />
              </view>

              <view
                v-else-if="isTimeoutIcon(menu)"
                class="timeout-mark timeout-mark--small"
                :style="{ '--mark-color': menu.iconColor || '#d97706' }"
              >
                <view class="timeout-face">
                  <view class="timeout-hand hand-hour" />
                  <view class="timeout-hand hand-minute" />
                  <view class="timeout-dot" />
                </view>
              </view>

              <wd-icon
                v-else
                :name="menu.icon"
                size="36rpx"
                :color="menu.iconColor || '#2f7dff'"
              />
            </view>

            <view class="row-copy">
              <view class="row-title">
                {{ menu.name }}
              </view>

              <view class="row-desc">
                {{ getDesc(menu.key) }}
              </view>
            </view>

            <wd-icon
              class="row-arrow"
              name="arrow-right"
              size="28rpx"
              color="#94a3b8"
            />
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

const menus = computed(() => {
  const dispatchMenus = getMenuGroups()
    .find(group => group.key === 'dispatch')
    ?.menus || []

  return dispatchMenus.filter(
    menu => menu.key !== 'businessWorkbench',
  )
})

const primaryMenus = computed(() => {
  const primaryKeys = [
    'outboundRecord',
    'assignmentTree',
    'timeoutReminder',
    'outboundGrid',
  ]

  return menus.value.filter(menu =>
    primaryKeys.includes(menu.key),
  )
})

function getIconStyle(menu: MenuItem) {
  return {
    backgroundColor: menu.iconColor
      ? `${menu.iconColor}14`
      : '#eef5ff',
  }
}

function getDesc(key: string) {
  const descriptionMap: Record<string, string> = {
    outboundRecord: '新增、领取、跟进外呼记录',
    assignmentTree: '查看任务分发链路',
    outboundGrid: '维护网格基础资料',
    timeoutReminder: '处理超时未完成任务',
  }

  return descriptionMap[key] || '进入业务功能'
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
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background: #f3f6fb;
}

.category-scroll {
  min-height: 0;
  flex: 1;
}

.category-content {
  box-sizing: border-box;
  padding: 24rpx;
}

/* =========================
   顶部介绍
========================= */

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  padding: 26rpx;
  border: 1rpx solid #dbe8ff;
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 14rpx 34rpx rgba(47, 125, 255, 0.08);
}

.header-copy {
  flex: 1;
  min-width: 0;
  margin-right: 24rpx;
}

.header-logo {
  flex-shrink: 0;
}

.header-kicker {
  color: #2f7dff;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 30rpx;
}

.header-title {
  margin-top: 8rpx;
  color: #0b2b5c;
  font-size: 38rpx;
  font-weight: 800;
  line-height: 52rpx;
}

.header-subtitle {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 24rpx;
  line-height: 34rpx;
}

/* =========================
   快捷入口
========================= */

.shortcut-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 20rpx;
}

.shortcut-card,
.menu-row {
  box-sizing: border-box;
  border: 1rpx solid #e3ebf7;
  border-radius: 18rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 26rpx rgba(47, 125, 255, 0.07);
}

.shortcut-card {
  width: calc(50% - 8rpx);
  min-height: 168rpx;
  padding: 22rpx;
}

.shortcut-card:nth-child(n + 3) {
  margin-top: 16rpx;
}

.shortcut-card:active,
.menu-row:active {
  opacity: 0.8;
}

.shortcut-icon,
.row-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
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
  line-height: 40rpx;
}

.shortcut-desc {
  overflow: hidden;
  margin-top: 6rpx;
  color: #64748b;
  font-size: 23rpx;
  line-height: 32rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =========================
   全部功能
========================= */

.section-title {
  margin: 28rpx 0 16rpx;
  color: #0b2b5c;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 42rpx;
}

.menu-list {
  display: block;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
}

.menu-row {
  display: flex;
  min-height: 104rpx;
  align-items: center;
  padding: 18rpx;
}

.menu-row + .menu-row {
  margin-top: 14rpx;
}

.row-icon {
  width: 70rpx;
  height: 70rpx;
  margin-right: 22rpx;
}

.row-copy {
  flex: 1;
  min-width: 0;
  margin-right: 16rpx;
}

.row-title {
  color: #0b2b5c;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 40rpx;
}

.row-desc {
  overflow: hidden;
  margin-top: 4rpx;
  color: #64748b;
  font-size: 23rpx;
  line-height: 32rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-arrow {
  flex-shrink: 0;
}

/* =========================
   分发链路图标
========================= */

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

/* =========================
   超时图标
========================= */

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
  box-sizing: border-box;
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
