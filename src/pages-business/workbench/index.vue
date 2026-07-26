<template>
  <view class="yd-page-container yd-page-container-paging business-workbench">
    <wd-navbar title="配送调度工作台" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <scroll-view scroll-y class="workbench-scroll">
      <view class="workbench-content">
        <view class="overview">
          <view class="overview-head">
            <view class="overview-main">
              <wd-img class="overview-logo" src="/static/logo.svg" width="72rpx" height="72rpx" mode="aspectFit" />
              <view class="overview-copy">
                <view class="overview-label">
                  今日调度概览
                </view>
                <view class="overview-title">
                  {{ summary.systemName || '配送调度系统' }}
                </view>
              </view>
            </view>
            <view class="overview-status">
              <view class="overview-status-icon">
                <wd-icon name="check-circle" size="28rpx" color="#2f7dff" />
              </view>
              <text>{{ summary.runStatus || '正常' }}</text>
            </view>
          </view>
          <view class="overview-date">
            数据日期 {{ summary.currentDate || today }}
          </view>
        </view>

        <view class="section-head">
          <view>
            <view class="section-title">
              快捷入口
            </view>
            <view class="section-subtitle">
              高频调度业务直达
            </view>
          </view>
        </view>
        <view class="entry-list">
          <view v-for="item in entries" :key="item.key" class="entry-item" @click="goModule(item.key)">
            <view class="entry-icon" :style="{ backgroundColor: item.tint }">
              <wd-icon :name="item.icon" size="36rpx" :color="item.color" />
            </view>
            <view class="entry-copy">
              <view class="entry-title">
                {{ item.title }}
              </view>
              <view class="entry-desc">
                {{ item.desc }}
              </view>
            </view>
            <view class="entry-arrow">
              <wd-icon name="arrow-right" size="30rpx" color="#94a3b8" />
            </view>
          </view>
        </view>

        <view class="bottom-space" />
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import type { OutboundWorkbenchSummary } from '@/api/business'
import { onMounted, ref } from 'vue'
import { businessApi } from '@/api/business'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const today = new Date().toISOString().slice(0, 10)
const summary = ref<OutboundWorkbenchSummary>({})

const entries = [
  { key: 'outboundRecord', title: '外呼记录', desc: '新增、查看、领取和跟进记录', icon: 'phone', color: '#2f7dff', tint: '#eff6ff' },
  { key: 'outboundPersonnel', title: '外呼人员', desc: '维护人员、角色、网格范围', icon: 'user-group', color: '#16a34a', tint: '#ecfdf5' },
  { key: 'outboundGrid', title: '网格管理', desc: '维护业务网格基础资料', icon: 'location', color: '#0891b2', tint: '#ecfeff' },
  { key: 'bizPackage', title: '套餐管理', desc: '维护套餐名称、编码和价格', icon: 'home', color: '#7c3aed', tint: '#f5f3ff' },
  { key: 'customerInfo', title: '客户信息', desc: '查看和维护客户线索', icon: 'user', color: '#d97706', tint: '#fff7ed' },
  { key: 'timeoutReminder', title: '超时记录', desc: '查看超时未处理任务', icon: 'exclamation-circle', color: '#dc2626', tint: '#fef2f2' },
  { key: 'assignmentTree', title: '分发记录', desc: '查看外呼记录分发链路', icon: 'arrow-right', color: '#2f7dff', tint: '#eff6ff' },
]

async function loadSummary() {
  uni.showLoading({ title: '加载中' })
  try {
    const data = await businessApi.workbenchSummary({ startDate: today, endDate: today })
    summary.value = data || {}
  } finally {
    uni.hideLoading()
  }
}

function goModule(key: string) {
  uni.navigateTo({ url: `/pages-business/manager/index?module=${key}` })
}

function handleBack() {
  navigateBackPlus()
}

onMounted(loadSummary)
</script>

<style scoped lang="scss">
.business-workbench {
  min-height: 100vh;
  background: #f3f6fb;
}

.workbench-scroll {
  min-height: 0;
  flex: 1;
}

.workbench-content {
  padding: 24rpx;
}

.overview {
  padding: 24rpx;
  border: 1rpx solid #dbe8ff;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 14rpx 34rpx rgba(47, 125, 255, 0.08);
}

.overview-head,
.overview-main {
  display: flex;
  align-items: center;
  justify-content: center;
}

.overview-head {
  justify-content: space-between;
}

.overview-main {
  min-width: 0;
  flex: 1;
  justify-content: flex-start;
}

.overview-logo {
  flex-shrink: 0;
  margin-right: 18rpx;
}

.overview-copy {
  min-width: 0;
  flex: 1;
  padding-right: 20rpx;
}

.overview-label {
  color: #2f7dff;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 34rpx;
}

.overview-title {
  margin-top: 10rpx;
  color: #0b2b5c;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 46rpx;
}

.overview-date {
  margin-top: 18rpx;
  color: #64748b;
  font-size: 24rpx;
  line-height: 34rpx;
}

.overview-status {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 8rpx 12rpx;
  border-radius: 8rpx;
  color: #2f7dff;
  background: #eef5ff;
  font-size: 22rpx;
  font-weight: 650;
  line-height: 30rpx;
}

.overview-status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8rpx;
}

.entry-item {
  border: 1rpx solid #e8edf4;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 10rpx 28rpx rgba(47, 125, 255, 0.07);
}

.entry-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.entry-desc {
  color: #64748b;
  font-size: 24rpx;
  line-height: 34rpx;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin: 30rpx 0 16rpx;
}

.section-title {
  color: #0b2b5c;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 42rpx;
}

.section-subtitle {
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 23rpx;
  line-height: 32rpx;
}

.entry-list {
  display: grid;
}

.entry-item + .entry-item {
  margin-top: 16rpx;
}

.entry-item {
  display: flex;
  min-height: 120rpx;
  align-items: center;
  box-sizing: border-box;
  padding: 24rpx;
}

.entry-icon {
  width: 72rpx;
  height: 72rpx;
  margin-right: 30rpx;
  border-radius: 18rpx;
}

.entry-copy {
  min-width: 0;
  flex: 1;
  padding-right: 8rpx;
}

.entry-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12rpx;
}

.entry-title {
  color: #0b2b5c;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 42rpx;
}

.entry-desc {
  overflow: hidden;
  margin-top: 8rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bottom-space {
  height: 48rpx;
}
</style>
