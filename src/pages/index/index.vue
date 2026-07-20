<template>
  <view class="home-page">
    <wd-navbar title="配送调度系统" placeholder safe-area-inset-top fixed custom-class="home-navbar">
      <template #right>
        <view class="nav-action" @click="gotoSearch">
          <wd-icon name="search-line" size="38rpx" color="#111827" />
        </view>
      </template>
    </wd-navbar>

    <scroll-view scroll-y class="home-scroll">
      <view class="summary-panel">
        <view class="summary-head">
          <view class="brand-lockup">
            <wd-img src="/static/logo.svg" width="72rpx" height="72rpx" mode="aspectFit" />
            <view>
              <view class="summary-title">
                今日调度
              </view>
              <view class="summary-subtitle">
                {{ greeting }}，{{ userInfo.nickname || userInfo.username || '管理员' }}
              </view>
            </view>
          </view>
          <view class="run-status">
            <wd-icon name="check-circle" size="28rpx" color="#0f766e" />
            <text>{{ summary.runStatus || '正常' }}</text>
          </view>
        </view>
      </view>

      <view class="metric-grid compact">
        <view v-for="item in metrics" :key="item.key" class="metric-card">
          <view class="metric-head">
            <text>{{ item.title }}</text>
            <view class="metric-dot" :style="{ backgroundColor: item.color }" />
          </view>
          <view class="metric-value">
            {{ item.value }}
          </view>
          <view class="metric-desc">
            {{ item.desc }}
          </view>
        </view>
      </view>

      <view class="section-block">
        <view class="section-title-row">
          <view>
            <view class="section-title">
              业务分类
            </view>
            <view class="section-subtitle">
              按操作场景进入对应模块
            </view>
          </view>
        </view>
        <view class="category-grid">
          <view v-for="item in categoryEntries" :key="item.key" class="category-card" @click="goTab(item.path)">
            <view class="category-icon" :style="{ backgroundColor: item.tint }">
              <wd-icon :name="item.icon" size="42rpx" :color="item.color" />
            </view>
            <view class="category-copy">
              <view class="category-title">
                {{ item.title }}
              </view>
              <view class="category-desc">
                {{ item.desc }}
              </view>
            </view>
            <wd-icon name="arrow-right" size="28rpx" color="#94a3b8" />
          </view>
        </view>
      </view>

      <view class="bottom-space" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { OutboundWorkbenchSummary } from '@/api/business'
import { storeToRefs } from 'pinia'
import { businessApi } from '@/api/business'
import { useUserStore } from '@/store'

defineOptions({
  name: 'Home',
})

definePage({
  type: 'home',
  style: {
    navigationStyle: 'custom',
  },
})

const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

const summary = ref<OutboundWorkbenchSummary>({})
const metrics = ref([
  { key: 'unassigned', title: '待分发', value: 0, desc: '等待调度', color: '#2563eb' },
  { key: 'pendingClaim', title: '待领取', value: 0, desc: '待业务处理', color: '#d97706' },
  { key: 'claimed', title: '已领取', value: 0, desc: '正在跟进', color: '#16a34a' },
  { key: 'successHandled', title: '成功办理', value: 0, desc: '已完成', color: '#0891b2' },
])

const categoryEntries = [
  { key: 'dispatch', title: '调度', desc: '外呼、分发、网格、超时', icon: 'phone', color: '#0f766e', tint: '#effaf7', path: '/pages/bpm/index' },
  { key: 'personnel', title: '人员', desc: '人员账号、角色与业务范围', icon: 'user-group', color: '#2563eb', tint: '#eff6ff', path: '/pages/contact/index' },
  { key: 'store', title: '门店', desc: '套餐、客户、门店资料', icon: 'shop', color: '#d97706', tint: '#fff7ed', path: '/pages/message/index' },
]
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6)
    return '凌晨好'
  if (hour < 9)
    return '早上好'
  if (hour < 12)
    return '上午好'
  if (hour < 14)
    return '中午好'
  if (hour < 18)
    return '下午好'
  return '晚上好'
})

function getSummaryValue(list: any[] | undefined, key: string) {
  const candidates = key === 'successHandled'
    ? ['successHandled', 'reviewRequired', 'successHandleTotal', 'successTotal', 'successCount', 'success']
    : [key]
  return Number(list?.find(item => candidates.includes(item.key))?.value ?? 0)
}

async function loadSummary() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const data = await businessApi.workbenchSummary({ startDate: today, endDate: today })
    summary.value = data || {}
    metrics.value = metrics.value.map(item => ({
      ...item,
      value: getSummaryValue(data?.cards, item.key),
    }))
  } catch {
    summary.value = {}
  }
}

function gotoSearch() {
  uni.navigateTo({
    url: '/pages/index/search/index',
  })
}

function goModule(module: string) {
  uni.navigateTo({ url: `/pages-business/manager/index?module=${module}` })
}

function goTab(url: string) {
  uni.switchTab({ url })
}

onShow(() => {
  loadSummary()
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: #f4f7f6;
}

.home-scroll {
  height: calc(100vh - 88rpx);
}

.nav-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
}

.summary-panel,
.section-block,
.metric-card {
  border: 1rpx solid #e2ebe8;
  border-radius: 8rpx;
  background: #fff;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.05);
}

.summary-panel {
  margin: 24rpx 24rpx 0;
  padding: 24rpx;
}

.summary-head,
.brand-lockup,
.run-status,
.section-title-row {
  display: flex;
  align-items: center;
}

.summary-head,
.section-title-row {
  justify-content: space-between;
  gap: 18rpx;
}

.brand-lockup {
  min-width: 0;
  flex: 1;
  gap: 18rpx;
}

.summary-title {
  color: #111827;
  font-size: 34rpx;
  font-weight: 800;
}

.summary-subtitle {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 24rpx;
}

.run-status {
  gap: 8rpx;
  flex-shrink: 0;
  padding: 8rpx 12rpx;
  border-radius: 8rpx;
  color: #0f766e;
  background: #effaf7;
  font-size: 22rpx;
  font-weight: 650;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin: 22rpx 24rpx 0;
}

.metric-grid.compact {
  margin-top: 16rpx;
}

.metric-card {
  min-height: 148rpx;
  padding: 22rpx;
}

.metric-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #64748b;
  font-size: 24rpx;
}

.metric-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}

.metric-value {
  margin-top: 16rpx;
  color: #0f172a;
  font-size: 42rpx;
  font-weight: 800;
}

.metric-desc {
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 22rpx;
}

.section-block {
  margin: 24rpx 24rpx 0;
  padding: 24rpx;
}

.section-title {
  color: #111827;
  font-size: 30rpx;
  font-weight: 800;
}

.section-subtitle {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 22rpx;
}

.category-grid {
  display: grid;
  gap: 16rpx;
  margin-top: 22rpx;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 112rpx;
  padding: 20rpx;
  border: 1rpx solid #e2ebe8;
  border-radius: 8rpx;
  background: #fbfdff;
}

.category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
  border-radius: 8rpx;
}

.category-copy {
  min-width: 0;
  flex: 1;
}

.category-title {
  color: #111827;
  font-size: 30rpx;
  font-weight: 750;
}

.category-desc {
  overflow: hidden;
  margin-top: 6rpx;
  color: #64748b;
  font-size: 23rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bottom-space {
  height: 48rpx;
}
</style>
