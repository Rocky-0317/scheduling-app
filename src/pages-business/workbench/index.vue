<template>
  <view class="yd-page-container yd-page-container-paging business-workbench">
    <wd-navbar title="配送调度工作台" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <scroll-view scroll-y class="workbench-scroll">
      <view class="workbench-content">
        <view class="overview">
          <view class="overview-head">
            <view class="overview-main">
              <wd-img src="/static/logo.svg" width="72rpx" height="72rpx" mode="aspectFit" />
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
              <wd-icon name="check-circle" size="28rpx" color="#0f766e" />
              <text>{{ summary.runStatus || '正常' }}</text>
            </view>
          </view>
          <view class="overview-date">
            数据日期 {{ summary.currentDate || today }}
          </view>
          <view class="flow-grid">
            <view v-for="item in statusItems" :key="item.key" class="flow-card">
              <view class="flow-value">
                {{ item.value ?? 0 }}
              </view>
              <view class="flow-label">
                {{ item.label }}
              </view>
            </view>
          </view>
        </view>

        <view class="metrics">
          <view v-for="item in metrics" :key="item.key" class="metric-card">
            <view class="metric-top">
              <view class="metric-icon" :style="{ backgroundColor: item.tint }">
                <wd-icon :name="item.icon" size="34rpx" :color="item.color" />
              </view>
              <view class="metric-title">
                {{ item.title }}
              </view>
            </view>
            <view class="metric-value">
              {{ item.value ?? 0 }}
            </view>
            <view class="metric-desc">
              {{ item.description || '-' }}
            </view>
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
            <wd-icon name="arrow-right" size="30rpx" color="#94a3b8" />
          </view>
        </view>

        <view class="section-head">
          <view>
            <view class="section-title">
              任务状态
            </view>
            <view class="section-subtitle">
              今日任务流转概况
            </view>
          </view>
        </view>
        <view class="status-list">
          <view v-for="item in statusItems" :key="item.key" class="status-item">
            <view class="status-top">
              <view class="status-name">
                {{ item.label }}
              </view>
              <view class="status-value">
                {{ item.value ?? 0 }}
              </view>
            </view>
            <view class="status-bar">
              <view class="status-progress" :style="{ width: getStatusWidth(item.value), backgroundColor: item.color }" />
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

const metrics = ref([
  { key: 'unassigned', title: '待分发记录', value: 0, description: '等待调度处理', icon: 'clock-circle', color: '#2563eb', tint: '#eff6ff' },
  { key: 'pendingClaim', title: '待领取任务', value: 0, description: '业务人员待跟进', icon: 'user', color: '#d97706', tint: '#fff7ed' },
  { key: 'claimed', title: '已领取任务', value: 0, description: '正在跟进处理', icon: 'check-circle', color: '#16a34a', tint: '#ecfdf5' },
  { key: 'successHandled', title: '成功办理量', value: 0, description: '成功办理', icon: 'dashboard', color: '#0891b2', tint: '#ecfeff' },
])

const statusItems = ref([
  { key: 'unassigned', label: '未分发', value: 0, color: '#2563eb' },
  { key: 'pendingClaim', label: '待领取', value: 0, color: '#d97706' },
  { key: 'claimed', label: '已领取', value: 0, color: '#16a34a' },
  { key: 'successHandled', label: '成功办理量', value: 0, color: '#0891b2' },
])

const entries = [
  { key: 'outboundRecord', title: '外呼记录', desc: '新增、查看、领取和跟进记录', icon: 'phone', color: '#2563eb', tint: '#eff6ff' },
  { key: 'outboundPersonnel', title: '外呼人员', desc: '维护人员、角色、网格范围', icon: 'user-group', color: '#16a34a', tint: '#ecfdf5' },
  { key: 'outboundGrid', title: '网格管理', desc: '维护业务网格基础资料', icon: 'location', color: '#0891b2', tint: '#ecfeff' },
  { key: 'bizPackage', title: '套餐管理', desc: '维护套餐名称、编码和价格', icon: 'goods', color: '#7c3aed', tint: '#f5f3ff' },
  { key: 'customerInfo', title: '客户信息', desc: '查看和维护客户线索', icon: 'user', color: '#d97706', tint: '#fff7ed' },
  { key: 'timeoutReminder', title: '超时提醒', desc: '查看超时未处理任务', icon: 'warning', color: '#dc2626', tint: '#fef2f2' },
  { key: 'assignmentTree', title: '分发记录', desc: '查看外呼记录分发链路', icon: 'share', color: '#0f766e', tint: '#f0fdfa' },
]

function getValue(list: any[] | undefined, key: string) {
  const candidates = key === 'successHandled'
    ? ['successHandled', 'reviewRequired', 'successHandleTotal', 'successTotal', 'successCount', 'success']
    : [key]
  return list?.find(item => candidates.includes(item.key))?.value ?? 0
}

async function loadSummary() {
  uni.showLoading({ title: '加载中' })
  try {
    const data = await businessApi.workbenchSummary({ startDate: today, endDate: today })
    summary.value = data || {}
    metrics.value = metrics.value.map(item => ({
      ...item,
      value: getValue(data?.cards, item.key),
    }))
    statusItems.value = statusItems.value.map(item => ({
      ...item,
      value: getValue(data?.taskStatuses, item.key),
    }))
  } finally {
    uni.hideLoading()
  }
}

function goModule(key: string) {
  uni.navigateTo({ url: `/pages-business/manager/index?module=${key}` })
}

function getStatusWidth(value: number | undefined) {
  const max = Math.max(...statusItems.value.map(item => Number(item.value || 0)), 1)
  const percent = Math.max(8, Math.round((Number(value || 0) / max) * 100))
  return `${percent}%`
}

function handleBack() {
  navigateBackPlus()
}

onMounted(loadSummary)
</script>

<style scoped lang="scss">
.business-workbench {
  min-height: 100vh;
  background: #f4f7f6;
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
  border: 1rpx solid #dfe9e7;
  border-radius: 8rpx;
  background: #fff;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.05);
}

.overview-head,
.overview-main {
  display: flex;
  align-items: center;
  justify-content: center;
}

.overview-head {
  justify-content: space-between;
  gap: 20rpx;
}

.overview-main {
  min-width: 0;
  flex: 1;
  justify-content: flex-start;
  gap: 18rpx;
}

.overview-copy {
  min-width: 0;
  flex: 1;
}

.overview-label {
  color: #0f766e;
  font-size: 24rpx;
  font-weight: 600;
}

.overview-title {
  margin-top: 10rpx;
  color: #0f172a;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1.2;
}

.overview-date {
  margin-top: 18rpx;
  color: #64748b;
  font-size: 24rpx;
}

.overview-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
  padding: 8rpx 12rpx;
  border-radius: 8rpx;
  color: #0f766e;
  background: #effaf7;
  font-size: 22rpx;
  font-weight: 650;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 22rpx;
}

.flow-card {
  padding: 16rpx 8rpx;
  border: 1rpx solid #e6efec;
  border-radius: 8rpx;
  background: #f8fbfa;
  text-align: center;
}

.flow-value {
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 800;
}

.flow-label {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 24rpx;
}

.metric-card,
.entry-item,
.status-item {
  border: 1rpx solid #e8edf4;
  border-radius: 8rpx;
  background: #fff;
  box-shadow: 0 8rpx 26rpx rgba(15, 23, 42, 0.05);
}

.metric-card {
  padding: 24rpx;
}

.metric-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.metric-icon,
.entry-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-icon {
  width: 58rpx;
  height: 58rpx;
  border-radius: 8rpx;
}

.metric-title,
.metric-desc,
.entry-desc,
.status-name {
  color: #64748b;
  font-size: 24rpx;
}

.metric-value {
  margin: 16rpx 0 10rpx;
  color: #0f172a;
  font-size: 42rpx;
  font-weight: 800;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin: 30rpx 0 16rpx;
}

.section-title {
  color: #1f2937;
  font-size: 30rpx;
  font-weight: 800;
}

.section-subtitle {
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 23rpx;
}

.entry-list,
.status-list {
  display: grid;
  gap: 16rpx;
}

.entry-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 24rpx;
}

.entry-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 8rpx;
}

.entry-copy {
  min-width: 0;
  flex: 1;
}

.entry-title {
  color: #111827;
  font-size: 30rpx;
  font-weight: 700;
}

.entry-desc {
  overflow: hidden;
  margin-top: 8rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-item {
  padding: 22rpx 24rpx;
}

.status-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-value {
  color: #111827;
  font-size: 36rpx;
  font-weight: 800;
}

.status-bar {
  overflow: hidden;
  height: 10rpx;
  margin-top: 18rpx;
  border-radius: 999rpx;
  background: #eef2f7;
}

.status-progress {
  height: 100%;
  min-width: 8%;
  border-radius: 999rpx;
}

.bottom-space {
  height: 48rpx;
}
</style>
