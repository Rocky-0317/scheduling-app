<template>
  <view class="yd-page-container mine-page">
    <scroll-view scroll-y class="mine-scroll">
      <view class="mine-content">
        <view class="mine-hero" @click="handleGoProfile">
          <view class="hero-copy">
            <view class="hero-kicker">
              MY CENTER
            </view>
            <view class="hero-title">
              我的
            </view>
            <view class="hero-subtitle">
              账号资料、安全设置与服务支持
            </view>
          </view>
          <view class="hero-orbit">
            <view class="orbit-node node-a" />
            <view class="orbit-node node-b" />
            <view class="orbit-line" />
          </view>
        </view>

        <view class="profile-panel" @click="handleGoProfile">
          <view class="avatar-shell">
            <wd-img :src="userInfo.avatar" width="116rpx" height="116rpx" mode="aspectFill" round />
          </view>
          <view class="profile-copy">
            <view class="profile-name">
              {{ userInfo.nickname || userInfo.username || '未命名用户' }}
            </view>
            <view class="profile-meta">
              {{ profileMeta }}
            </view>
          </view>
          <view class="profile-action">
            <wd-icon name="arrow-right" size="30rpx" color="#9aa8bc" />
          </view>
        </view>

        <view class="summary-grid">
          <view class="summary-item">
            <view class="summary-value">
              {{ roleCount }}
            </view>
            <view class="summary-label">
              角色
            </view>
          </view>
          <view class="summary-item">
            <view class="summary-value text-fit">
              {{ postCount }}
            </view>
            <view class="summary-label">
              岗位
            </view>
          </view>
          <view class="summary-item">
            <view class="summary-value status-text">
              正常
            </view>
            <view class="summary-label">
              账号状态
            </view>
          </view>
        </view>

        <view class="quick-grid">
          <view
            v-for="item in quickActions"
            :key="item.title"
            class="quick-card"
            @click="item.action"
          >
            <view class="quick-icon" :style="{ backgroundColor: item.tint }">
              <wd-icon :name="item.icon" size="38rpx" :color="item.color" />
            </view>
            <text>{{ item.title }}</text>
          </view>
        </view>

        <view class="section-card">
          <view class="section-head">
            <view>
              <view class="section-title">
                账号管理
              </view>
              <view class="section-subtitle">
                个人资料与安全能力
              </view>
            </view>
          </view>

          <TenantVisitPicker
            v-if="tenantEnabled && hasAccessByCodes(['system:tenant:visit'])"
            @confirm="handleTenantConfirm"
          >
            <template #default="{ value }">
              <view class="menu-row">
                <view class="menu-left">
                  <view class="menu-icon tenant">
                    <wd-icon name="home" size="32rpx" color="#2f7dff" />
                  </view>
                  <view class="menu-copy">
                    <view class="menu-title">
                      当前租户
                    </view>
                    <view class="menu-desc">
                      {{ value || '请选择租户' }}
                    </view>
                  </view>
                </view>
                <wd-icon name="arrow-right" size="28rpx" color="#9aa8bc" />
              </view>
            </template>
          </TenantVisitPicker>

          <view v-for="item in accountMenus" :key="item.title" class="menu-row" @click="item.action">
            <view class="menu-left">
              <view class="menu-icon" :style="{ backgroundColor: item.tint }">
                <wd-icon :name="item.icon" size="32rpx" :color="item.color" />
              </view>
              <view class="menu-copy">
                <view class="menu-title">
                  {{ item.title }}
                </view>
                <view class="menu-desc">
                  {{ item.desc }}
                </view>
              </view>
            </view>
            <wd-icon name="arrow-right" size="28rpx" color="#9aa8bc" />
          </view>
        </view>

        <view class="section-card">
          <view class="section-head">
            <view>
              <view class="section-title">
                服务支持
              </view>
              <view class="section-subtitle">
                帮助、反馈与应用设置
              </view>
            </view>
          </view>

          <view v-for="item in supportMenus" :key="item.title" class="menu-row" @click="item.action">
            <view class="menu-left">
              <view class="menu-icon" :style="{ backgroundColor: item.tint }">
                <wd-icon :name="item.icon" size="32rpx" :color="item.color" />
              </view>
              <view class="menu-copy">
                <view class="menu-title">
                  {{ item.title }}
                </view>
                <view class="menu-desc">
                  {{ item.desc }}
                </view>
              </view>
            </view>
            <wd-icon name="arrow-right" size="28rpx" color="#9aa8bc" />
          </view>
        </view>

        <wd-button block type="danger" custom-class="logout-button" @click="handleLogout">
          <wd-icon name="arrow-right" size="28rpx" color="#fff" custom-class="button-icon" />
          退出登录
        </wd-button>

        <view class="bottom-space" />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { TenantVO } from '@/api/login'
import type { UserProfileVO } from '@/api/system/user/profile'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { getUserProfile } from '@/api/system/user/profile'
import { useAccess } from '@/hooks/useAccess'
import { LOGIN_PAGE } from '@/router/config'
import { useUserStore } from '@/store'
import { useDictStore } from '@/store/dict'
import { useTokenStore } from '@/store/token'
import TenantVisitPicker from './components/tenant-visit-picker.vue'

definePage({
  style: {
    navigationStyle: 'custom',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()
const dictStore = useDictStore()
const toast = useToast()
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()
const { userInfo, roles } = storeToRefs(userStore)
const userProfile = ref<UserProfileVO | null>(null)
const tenantEnabled = computed(() => import.meta.env.VITE_APP_TENANT_ENABLE === 'true')

// 取 roleName 中文名称
const profileRoles = computed(() => userProfile.value?.roles?.map(role => role.roleName).filter(Boolean) || [])
const roleNames = computed(() => {
  if (profileRoles.value.length) {
    return profileRoles.value.join('、')
  }
  return roles.value.length ? roles.value.join('、') : '暂无角色'
})
const roleCount = computed(() => userProfile.value?.roles?.length || roles.value.length)
const postCount = computed(() => userProfile.value?.posts?.length || 0)
const profileMeta = computed(() => `角色：${roleNames.value}`)

const quickActions = [
  { title: '资料', icon: 'user', color: '#2f7dff', tint: '#eff6ff', action: handleGoProfile },
  { title: '安全', icon: 'lock', color: '#16a34a', tint: '#ecfdf5', action: handleGoSecurity },
  { title: '反馈', icon: 'edit', color: '#7c3aed', tint: '#f5f3ff', action: handleGoFeedback },
  { title: '客服', icon: 'phone', color: '#0891b2', tint: '#ecfeff', action: handleGoContact },
]

const accountMenus = [
  { title: '个人资料', desc: '头像、昵称、手机和邮箱', icon: 'user', color: '#2f7dff', tint: '#eff6ff', action: handleGoProfile },
  { title: '账号安全', desc: '密码修改与第三方绑定', icon: 'lock', color: '#16a34a', tint: '#ecfdf5', action: handleGoSecurity },
]

const supportMenus = [
  { title: '意见反馈', desc: '提交建议或问题反馈', icon: 'edit', color: '#7c3aed', tint: '#f5f3ff', action: handleGoFeedback },
  { title: '联系客服', desc: '二维码、电话和服务时间', icon: 'phone', color: '#0891b2', tint: '#ecfeff', action: handleGoContact },
  { title: '应用设置', desc: '协议、隐私和本地设置', icon: 'settings', color: '#2f7dff', tint: '#eff6ff', action: handleGoSettings },
]

onShow(() => {
  void loadUserProfile()
})

async function loadUserProfile() {
  userProfile.value = await getUserProfile()
}

function handleGoProfile() {
  uni.navigateTo({ url: '/pages-core/user/profile/index' })
}

function handleGoSecurity() {
  uni.navigateTo({ url: '/pages-core/user/security/index' })
}

function handleGoFeedback() {
  uni.navigateTo({ url: '/pages-core/user/feedback/index' })
}

function handleGoContact() {
  uni.navigateTo({ url: '/pages-core/user/contact/index' })
}

function handleGoSettings() {
  uni.navigateTo({ url: '/pages-core/user/settings/index' })
}

async function handleTenantConfirm(tenant: TenantVO) {
  const currentTenantId = userStore.visitTenantId || userStore.tenantId
  if (tenant.id === currentTenantId) {
    return
  }
  const restoreLoginTenant = tenant.id === userStore.tenantId
  try {
    await dialog.confirm({
      title: '切换租户',
      msg: restoreLoginTenant
        ? `确定恢复访问登录租户「${tenant.name}」吗？`
        : `确定切换至租户「${tenant.name}」吗？切换后业务数据将按该租户展示。`,
    })
  } catch {
    return
  }
  userStore.setVisitTenantId(restoreLoginTenant ? null : tenant.id)
  dictStore.clearDictCache()
  toast.success(restoreLoginTenant ? '已恢复登录租户' : `已切换至${tenant.name}`)
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/index/index' })
  }, 500)
}

async function handleLogout() {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要退出登录吗？',
    })
  } catch {
    return
  }

  await tokenStore.logout()
  toast.success('退出登录成功')
  setTimeout(() => {
    uni.reLaunch({ url: LOGIN_PAGE })
  }, 500)
}
</script>

<style lang="scss" scoped>
.mine-page {
  min-height: 100vh;
  background: #f3f6fb;
}

.mine-scroll {
  min-height: 0;
  flex: 1;
}

.mine-content {
  padding: 28rpx 24rpx 0;
}

.mine-hero {
  position: relative;
  min-height: 220rpx;
  overflow: hidden;
  border: 1rpx solid #dce8f8;
  border-radius: 28rpx;
  background:
    radial-gradient(circle at 82% 34%, rgba(47, 125, 255, 0.14) 0, rgba(47, 125, 255, 0) 190rpx),
    linear-gradient(135deg, #ffffff 0%, #f7fbff 58%, #edf5ff 100%);
  box-shadow: 0 20rpx 48rpx rgba(31, 90, 180, 0.1);
}

.hero-copy {
  position: relative;
  z-index: 2;
  padding: 34rpx 32rpx;
}

.hero-kicker {
  color: #2f7dff;
  font-size: 21rpx;
  font-weight: 900;
}

.hero-title {
  margin-top: 20rpx;
  color: #081638;
  font-size: 48rpx;
  font-weight: 950;
  line-height: 1;
}

.hero-subtitle {
  margin-top: 18rpx;
  color: #64748b;
  font-size: 25rpx;
}

.hero-orbit {
  position: absolute;
  right: -26rpx;
  top: 30rpx;
  width: 210rpx;
  height: 160rpx;
  border: 18rpx solid rgba(47, 125, 255, 0.08);
  border-radius: 50%;
}

.orbit-line {
  position: absolute;
  left: 28rpx;
  top: 78rpx;
  width: 156rpx;
  height: 5rpx;
  border-radius: 999rpx;
  background: rgba(47, 125, 255, 0.26);
  transform: rotate(-18deg);
}

.orbit-node {
  position: absolute;
  z-index: 2;
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  background: #2f7dff;
  box-shadow: 0 0 0 10rpx rgba(47, 125, 255, 0.12);
}

.node-a {
  left: 46rpx;
  top: 58rpx;
}

.node-b {
  right: 42rpx;
  bottom: 48rpx;
}

.profile-panel,
.section-card,
.quick-card,
.summary-item {
  border: 1rpx solid #e3ebf7;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 14rpx 34rpx rgba(34, 76, 145, 0.07);
}

.profile-panel {
  display: flex;
  align-items: center;
  margin-top: 22rpx;
  padding: 26rpx;
  border-radius: 26rpx;
}

.avatar-shell {
  flex-shrink: 0;
  margin-right: 22rpx;
  padding: 6rpx;
  border: 1rpx solid #e3ebf7;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 12rpx 26rpx rgba(47, 125, 255, 0.12);
}

.profile-copy {
  min-width: 0;
  flex: 1;
  margin-right: 22rpx;
}

.profile-name {
  overflow: hidden;
  color: #0b2b5c;
  font-size: 36rpx;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-meta {
  overflow: hidden;
  margin-top: 10rpx;
  color: #64748b;
  font-size: 25rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-action {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 54rpx;
  height: 54rpx;
  border-radius: 50%;
  background: #f6f9fd;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 18rpx;
}

.summary-item {
  min-height: 112rpx;
  padding: 20rpx 8rpx;
  border-radius: 22rpx;
  text-align: center;
}

.summary-value {
  color: #0b2b5c;
  font-size: 34rpx;
  font-weight: 950;
}

.status-text {
  color: #16a34a;
  font-size: 28rpx;
}

.text-fit {
  max-width: 100%;
}

.summary-label {
  margin-top: 8rpx;
  color: #7a8799;
  font-size: 22rpx;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 22rpx;
}

.quick-card {
  display: flex;
  align-items: center;
  flex-direction: column;
  min-height: 130rpx;
  justify-content: center;
  border-radius: 22rpx;
  color: #18233a;
  font-size: 24rpx;
  font-weight: 750;
}

.quick-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62rpx;
  height: 62rpx;
  margin-bottom: 12rpx;
  border-radius: 18rpx;
}

.section-card {
  margin-top: 22rpx;
  padding: 26rpx 24rpx 10rpx;
  border-radius: 26rpx;
}

.section-head {
  margin-bottom: 16rpx;
}

.section-title {
  color: #0b2b5c;
  font-size: 31rpx;
  font-weight: 900;
}

.section-subtitle {
  margin-top: 7rpx;
  color: #7a8799;
  font-size: 23rpx;
}

.menu-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 104rpx;
  border-top: 1rpx solid #edf2f8;
}

.menu-left {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  margin-right: 20rpx;
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  flex-shrink: 0;
  margin-right: 22rpx;
  border-radius: 20rpx;
}

.menu-icon.tenant {
  background: #eff6ff;
}

.menu-copy {
  min-width: 0;
  flex: 1;
}

.menu-title {
  color: #0b2b5c;
  font-size: 28rpx;
  font-weight: 800;
}

.menu-desc {
  overflow: hidden;
  margin-top: 6rpx;
  color: #7a8799;
  font-size: 23rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.logout-button) {
  height: 90rpx;
  margin-top: 30rpx;
  border-radius: 24rpx;
  font-size: 29rpx;
  font-weight: 800;
  box-shadow: 0 16rpx 30rpx rgba(220, 38, 38, 0.18);
}

:deep(.button-icon) {
  margin-right: 8rpx;
  vertical-align: -3rpx;
}

.bottom-space {
  height: 58rpx;
}
</style>
