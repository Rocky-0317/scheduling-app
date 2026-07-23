<template>
  <view class="home-page">
    <wd-navbar title="配送调度" placeholder safe-area-inset-top fixed custom-class="home-navbar">
      <template #right>
        <view class="nav-action" @click="gotoSearch">
          <wd-icon name="search-line" size="38rpx" color="#2f7dff" />
        </view>
      </template>
    </wd-navbar>

    <scroll-view scroll-y class="home-scroll">
      <view class="hero-panel">
        <view class="hero-copy">
          <view class="hero-kicker">
            TODAY DISPATCH
          </view>
          <view class="hero-title">
            今日调度
          </view>
          <view class="hero-subtitle">
            {{ greeting }}，{{ userInfo.nickname || userInfo.username || '管理员' }}
          </view>
        </view>
        <view class="hero-status">
          <wd-icon name="check-circle" size="28rpx" color="#2f7dff" />
          <text>{{ summary.runStatus || '运行正常' }}</text>
        </view>
        <view class="hero-visual">
          <view class="route-line line-a" />
          <view class="route-line line-b" />
          <view class="route-node node-a" />
          <view class="route-node node-b" />
          <view class="route-node node-c" />
        </view>
      </view>

      <view class="metric-grid">
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

      <view class="section-block category-section">
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
            <view class="category-icon">
              <view v-if="item.key === 'store'" class="store-mark">
                <view class="store-mark__awning" />
                <view class="store-mark__body">
                  <view />
                  <view />
                </view>
              </view>
              <wd-icon v-else :name="item.icon" size="42rpx" color="#2f7dff" />
            </view>
            <view class="category-copy">
              <view class="category-title">
                {{ item.title }}
              </view>
              <view class="category-desc">
                {{ item.desc }}
              </view>
            </view>
            <wd-icon name="arrow-right" size="28rpx" color="#9ca3af" />
          </view>
        </view>
      </view>

      <view v-if="false" class="section-block quick-section">
        <view class="section-title-row">
          <view>
            <view class="section-title">
              推荐操作
            </view>
            <view class="section-subtitle">
              高频业务快捷入口
            </view>
          </view>
        </view>
        <view class="quick-grid">
          <view v-for="item in quickActions" :key="item.key" class="quick-card" @click="goModule(item.module)">
            <wd-icon :name="item.icon" size="38rpx" color="#2f7dff" />
            <text>{{ item.title }}</text>
          </view>
        </view>
      </view>

      <view class="bottom-space" />
    </scroll-view>

    <!-- APP更新弹窗 -->
    <view v-if="popupOpen" class="mask-layer">
      <view class="update-modal">
        <view class="modal-header">
          <text class="modal-subtitle">APP 更新</text>
          <view class="modal-title">
            {{ updateTitle }}
          </view>
          <view class="version-info">
            <text v-if="localVersion">当前版本 v{{ localVersion }}</text>
            <text v-if="latestVersion">最新版本 v{{ latestVersion }}</text>
          </view>
        </view>
        <view class="modal-content">
          {{ updateContent }}
        </view>
        <view class="modal-footer">
          <text v-if="forceUpdate" class="force-tip">当前版本不可继续使用，请更新 APP</text>
          <view class="btn-group">
            <button v-if="!forceUpdate" class="btn-cancel" @click="closePopup">
              稍后再说
            </button>
            <button class="btn-primary" @click="handleUpdate">
              立即更新
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { OutboundWorkbenchSummary } from '@/api/business'
import { storeToRefs } from 'pinia'
import { businessApi } from '@/api/business'
import { useUserStore } from '@/store'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

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
  { key: 'unassigned', title: '待分发', value: 0, desc: '等待调度', color: '#2f7dff' },
  { key: 'pendingClaim', title: '待领取', value: 0, desc: '待业务处理', color: '#d97706' },
  { key: 'claimed', title: '已领取', value: 0, desc: '正在跟进', color: '#16a34a' },
  { key: 'successHandled', title: '成功办理', value: 0, desc: '已完成', color: '#0891b2' },
])

const categoryEntries = [
  { key: 'dispatch', title: '调度', desc: '外呼、分发、网格、超时', icon: 'phone', path: '/pages/bpm/index' },
  { key: 'personnel', title: '人员', desc: '账号、角色与业务范围', icon: 'user-group', path: '/pages/contact/index' },
  { key: 'store', title: '门店', desc: '套餐、客户、门店资料', icon: 'store', path: '/pages/message/index' },
]

const quickActions: Array<{ key: string, title: string, icon: string, module: string }> = [
  { key: 'workbench', title: '业务工作台', icon: 'dashboard', module: 'workbench' },
  { key: 'outboundRecord', title: '外呼记录', icon: 'phone', module: 'outboundRecord' },
  { key: 'assignmentTree', title: '分发记录', icon: 'arrow-right', module: 'assignmentTree' },
  { key: 'timeoutReminder', title: '超时提醒', icon: 'exclamation-circle', module: 'timeoutReminder' },
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
  if (module === 'workbench') {
    uni.navigateTo({ url: '/pages-business/workbench/index' })
    return
  }
  uni.navigateTo({ url: `/pages-business/manager/index?module=${module}` })
}

function goTab(url: string) {
  uni.switchTab({ url })
}

// ====================== 版本更新弹窗【修复：标准全局事件监听，移除轮询】 ======================
interface UpdatePopupParams {
  latestVersion?: string
  localVersion?: string
  updateTitle?: string
  updateContent?: string
  downloadUrl?: string
  forceUpdate?: boolean
  onSkip?: () => void
}
const popupOpen = ref(false)
const latestVersion = ref('')
const localVersion = ref('')
const updateTitle = ref('发现新版本')
const updateContent = ref('请更新到最新版本后继续使用')
const downloadUrl = ref('')
const forceUpdate = ref(false)
let skipUpdateHandler: (() => void) | undefined

// 统一事件回调函数（必须单独抽离，卸载时精准清除监听）
function handleUpdatePopupEvent(data: UpdatePopupParams) {
  console.log('监听到版本更新事件', data)
  latestVersion.value = data.latestVersion || ''
  localVersion.value = data.localVersion || ''
  updateTitle.value = data.updateTitle || '发现新版本'
  updateContent.value = data.updateContent || '请更新到最新版本后继续使用'
  downloadUrl.value = data.downloadUrl || ''
  forceUpdate.value = Boolean(data.forceUpdate)
  skipUpdateHandler = data.onSkip
  popupOpen.value = true
}

function closePopup() {
  if (forceUpdate.value)
    return
  skipUpdateHandler?.()
  popupOpen.value = false
}

function handleUpdate() {
  if (!downloadUrl.value) {
    uni.showToast({ title: '暂无下载地址', icon: 'none' })
    return
  }
  // #ifdef APP-PLUS
  plus.downloader.createDownload(downloadUrl.value, {
    filename: '_scheduling_app.apk',
  }, (res) => {
    if (res.status === 200) {
      plus.runtime.install(res.filename)
    }
  }).start()
  // #endif

  // #ifdef H5 || MP-WEIXIN
  window.open(downloadUrl.value, '_blank')
  // #endif
}

onMounted(() => {
  // 注册全局更新弹窗事件监听
  uni.$on('app:openUpdatePopup', handleUpdatePopupEvent)
  loadSummary()
})

onUnmounted(() => {
  // 精准移除当前页面的事件监听，不影响全局其他页面
  uni.$off('app:openUpdatePopup', handleUpdatePopupEvent)
})
// =================================================================

onShow(() => {
  loadSummary()
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: #f3f6fb;
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
  border-radius: 50%;
  background: #eef5ff;
}

.hero-panel,
.section-block,
.metric-card {
  border: 1rpx solid rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14rpx 38rpx rgba(47, 125, 255, 0.08);
}

.hero-panel {
  position: relative;
  min-height: 330rpx;
  margin: 24rpx 24rpx 0;
  overflow: hidden;
  border-radius: 10rpx 52rpx 52rpx 52rpx;
  background:
    radial-gradient(circle at 82% 30%, rgba(47, 125, 255, 0.18) 0, rgba(47, 125, 255, 0) 220rpx),
    linear-gradient(118deg, #ffffff 0%, #f7fbff 56%, #eaf3ff 100%);
}

.hero-copy {
  position: relative;
  z-index: 1;
  width: 440rpx;
  padding: 42rpx 34rpx;
}

.hero-kicker {
  color: #2f7dff;
  font-size: 20rpx;
  font-weight: 850;
  letter-spacing: 0;
}

.hero-title {
  margin-top: 18rpx;
  color: #0b2b5c;
  font-size: 52rpx;
  font-weight: 950;
  line-height: 1.05;
}

.hero-subtitle {
  margin-top: 14rpx;
  color: #5f6f89;
  font-size: 26rpx;
  line-height: 1.42;
}

.hero-status {
  position: absolute;
  left: 34rpx;
  bottom: 32rpx;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  color: #0b2b5c;
  background: rgba(255, 255, 255, 0.82);
  font-size: 23rpx;
  font-weight: 750;
}

.hero-visual {
  position: absolute;
  right: -42rpx;
  top: 26rpx;
  width: 280rpx;
  height: 280rpx;
  border: 22rpx solid rgba(47, 125, 255, 0.12);
  border-radius: 50%;
}

.route-line {
  position: absolute;
  height: 4rpx;
  border-radius: 999rpx;
  background: rgba(47, 125, 255, 0.74);
  transform-origin: left center;
}

.line-a {
  left: 54rpx;
  top: 112rpx;
  width: 158rpx;
  transform: rotate(24deg);
}

.line-b {
  left: 76rpx;
  top: 172rpx;
  width: 128rpx;
  transform: rotate(-28deg);
}

.route-node {
  position: absolute;
  width: 28rpx;
  height: 28rpx;
  border: 6rpx solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  background: #2f7dff;
}

.node-a {
  left: 42rpx;
  top: 100rpx;
}

.node-b {
  right: 56rpx;
  top: 152rpx;
}

.node-c {
  left: 82rpx;
  bottom: 68rpx;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin: 22rpx 24rpx 0;
}

.metric-card {
  min-height: 156rpx;
  padding: 24rpx;
  border-radius: 26rpx;
}

.metric-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #6b7280;
  font-size: 24rpx;
}

.metric-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}

.metric-value {
  margin-top: 14rpx;
  color: #0b2b5c;
  font-size: 48rpx;
  font-weight: 950;
}

.metric-desc {
  margin-top: 4rpx;
  color: #9ca3af;
  font-size: 22rpx;
}

.section-block {
  margin: 24rpx 24rpx 0;
  padding: 26rpx;
  border-radius: 30rpx;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.section-title {
  color: #0b2b5c;
  font-size: 32rpx;
  font-weight: 900;
}

.section-subtitle {
  margin-top: 8rpx;
  color: #7a828d;
  font-size: 23rpx;
}

.category-grid {
  display: grid;
  gap: 16rpx;
  margin-top: 24rpx;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 118rpx;
  padding: 20rpx;
  border: 1rpx solid #edf0f2;
  border-radius: 24rpx;
  background: #fbfdff;
}

.category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  flex-shrink: 0;
  border-radius: 24rpx;
  background: #eef5ff;
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
  border: 4rpx solid #2f7dff;
  border-bottom: 0;
  border-radius: 8rpx 8rpx 3rpx 3rpx;
}

.store-mark__awning::before,
.store-mark__awning::after {
  position: absolute;
  top: 0;
  bottom: -2rpx;
  width: 4rpx;
  background: #2f7dff;
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
  border: 4rpx solid #2f7dff;
  border-radius: 3rpx;
  box-sizing: border-box;
}

.store-mark__body view {
  width: 6rpx;
  height: 13rpx;
  background: #2f7dff;
}

.category-copy {
  min-width: 0;
  flex: 1;
}

.category-title {
  color: #0b2b5c;
  font-size: 30rpx;
  font-weight: 850;
}

.category-desc {
  overflow: hidden;
  margin-top: 7rpx;
  color: #7a828d;
  font-size: 23rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 24rpx;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-height: 92rpx;
  padding: 0 22rpx;
  border: 1rpx solid #edf0f2;
  border-radius: 22rpx;
  color: #0b2b5c;
  background: #f8fbff;
  font-size: 25rpx;
  font-weight: 800;
}

.bottom-space {
  height: 56rpx;
}

/* 弹窗样式 */
.mask-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.update-modal {
  width: 620rpx;
  padding: 36rpx 32rpx 32rpx;
  border-radius: 18rpx;
  background: #ffffff;
}
.modal-header {
  padding-bottom: 22rpx;
  border-bottom: 1rpx solid #edf2f8;
}
.modal-subtitle {
  color: #2f7dff;
  font-size: 25rpx;
  font-weight: bold;
}
.modal-title {
  margin-top: 12rpx;
  color: #172033;
  font-size: 38rpx;
  font-weight: bold;
  line-height: 1.35;
}
.version-info {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 14rpx;
  color: #7a8799;
  font-size: 24rpx;
}
.modal-content {
  min-height: 150rpx;
  padding: 28rpx 0;
  color: #344054;
  font-size: 28rpx;
  line-height: 1.7;
  white-space: pre-wrap;
}
.force-tip {
  display: block;
  margin-bottom: 18rpx;
  color: #f56c6c;
  font-size: 24rpx;
  text-align: center;
}
.btn-group {
  display: flex;
  width: 100%;
  gap: 20rpx;
}
.btn-cancel,
.btn-primary {
  flex: 1;
  height: 88rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  line-height: 88rpx;
}
.btn-cancel {
  color: #667085;
  background: #f2f4f7;
}
.btn-primary {
  color: #fff;
  background: #2f7dff;
}
</style>
