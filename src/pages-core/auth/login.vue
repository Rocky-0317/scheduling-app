<template>
  <view class="auth-container login-page">
    <view class="auth-visual">
      <view class="visual-card">
        <view class="visual-card__copy">
          <view class="visual-brand">
            <view class="brand-icon">
              <view class="truck-mark">
                <view class="truck-box" />
                <view class="truck-cab" />
                <view class="truck-wheel wheel-a" />
                <view class="truck-wheel wheel-b" />
              </view>
            </view>
            <text class="visual-kicker">DISPATCH CENTER</text>
          </view>
          <text class="visual-title">让每一次配送、分发、领取都有迹可循。</text>
          <text class="visual-desc">实时查看调度状态，快速进入业务工作台。</text>
        </view>
        <view class="visual-clock">
          <view class="clock-ring" />
          <view class="clock-face">
            <view class="clock-hand hour" />
            <view class="clock-hand minute" />
            <view class="clock-dot" />
          </view>
        </view>
        <view class="visual-pin" />
        <view class="visual-path" />
      </view>
    </view>

    <view class="form-container">
      <view class="form-head">
        <view>
          <view class="form-title">
            欢迎登录
          </view>
          <view class="form-subtitle">
            使用调度系统账号进入工作台
          </view>
        </view>
      </view>

      <view class="auth-highlights">
        <view v-for="item in authHighlights" :key="item.title" class="auth-highlight">
          <view class="auth-highlight__icon">
            <wd-icon :name="item.icon" size="26rpx" color="#2f7dff" />
          </view>
          <text>{{ item.title }}</text>
        </view>
      </view>

      <TenantPicker
        v-if="!ruoyiAuthMode"
        ref="tenantPickerRef"
        :disabled="Boolean(socialBindingContext) || authLoading"
        :preferred-tenant-id="socialBindingContext?.tenantId"
      />
      <view v-if="socialBindingContext" class="social-bind-tip">
        第三方授权成功，请使用账号密码登录完成绑定
      </view>
      <view class="input-item">
        <wd-icon name="user" size="20px" color="#718096" />
        <wd-input
          v-model="formData.username"
          placeholder="请输入账号"
          clearable
          clear-trigger="focus"
        />
      </view>
      <view class="input-item">
        <wd-icon name="lock" size="20px" color="#718096" />
        <wd-input
          v-model="formData.password"
          placeholder="请输入密码"
          clearable
          clear-trigger="focus"
          show-password
        />
      </view>
      <view class="login-options">
        <view class="remember-row" @click="toggleRemember">
          <wd-checkbox v-model="rememberMe" type="square" @click.stop />
          <text>记住我</text>
        </view>
      </view>
      <view v-if="captchaEnabled">
        <Verify
          ref="verifyRef"
          :captcha-type="captchaType"
          explain="向右滑动完成验证"
          :img-size="{ width: '300px', height: '150px' }"
          mode="pop"
          @success="verifySuccess"
        />
      </view>

      <wd-button block :disabled="authLoading" :loading="loading" type="primary" @click="handleLogin">
        登录工作台
      </wd-button>
    </view>

    <view class="safe-tip">
      <wd-icon name="check-circle" size="28rpx" color="#8090aa" />
      <text>安全登录，保护您的数据安全</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SocialLoginBindingContext } from '@/utils/social-login'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import { useTokenStore } from '@/store/token'
import { ensureDecodeURIComponent, redirectAfterLogin } from '@/utils'
import { takeSocialLoginContext } from '@/utils/social-login'
import TenantPicker from './components/tenant-picker.vue'
import Verify from './components/verifition/verify.vue'

defineOptions({
  name: 'LoginPage',
})

const pageProps = defineProps<{
  redirect?: string
  socialBind?: string
}>()

definePage({
  style: {
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const loading = ref(false)
const rememberMe = ref(true)
const redirectUrl = ref(pageProps.redirect ? ensureDecodeURIComponent(pageProps.redirect) : undefined)
const tenantPickerRef = ref<InstanceType<typeof TenantPicker>>()
const captchaEnabled = import.meta.env.VITE_APP_CAPTCHA_ENABLE === 'true'
const ruoyiAuthMode = true
const verifyRef = ref<{ show: () => void }>()
const captchaType = ref<'blockPuzzle' | 'clickWord'>('blockPuzzle')

const formData = reactive({
  username: import.meta.env.VITE_APP_DEFAULT_LOGIN_USERNAME || '',
  password: import.meta.env.VITE_APP_DEFAULT_LOGIN_PASSWORD || '',
  code: '',
  uuid: '',
  captchaVerification: '',
})
const authHighlights = [
  { title: '外呼分发', icon: 'phone' },
  { title: '网格协同', icon: 'location' },
  { title: '超时闭环', icon: 'check-circle' },
]
const socialBindingContext = ref<SocialLoginBindingContext>()
const socialLoginLoading = ref(false)
const authLoading = computed(() => loading.value || socialLoginLoading.value)
const socialAuth = computed(() => {
  const context = socialBindingContext.value
  return context
    ? {
        socialType: context.socialType,
        socialCode: context.socialCode,
        socialState: context.socialState,
      }
    : undefined
})

onMounted(() => {
  if (pageProps.socialBind) {
    const context = takeSocialLoginContext()
    if (context?.stage === 'binding') {
      socialBindingContext.value = context
      redirectUrl.value = context.redirect || redirectUrl.value
    }
  }
})

async function getCode() {
  if (!captchaEnabled) {
    await verifySuccess({})
  } else {
    verifyRef.value?.show()
  }
}

async function handleLogin() {
  if (authLoading.value) {
    return
  }
  if (!validateTenant()) {
    return
  }
  if (!formData.username) {
    toast.warning('请输入用户名')
    return
  }
  if (!formData.password) {
    toast.warning('请输入密码')
    return
  }
  await getCode()
}

async function verifySuccess(params: { captchaVerification?: string }) {
  loading.value = true
  try {
    const tokenStore = useTokenStore()
    formData.captchaVerification = params.captchaVerification || ''
    await tokenStore.login({
      type: 'username',
      ...formData,
      ...socialAuth.value,
    })
    redirectAfterLogin(socialBindingContext.value?.redirect || redirectUrl.value)
  } finally {
    loading.value = false
  }
}

function validateTenant() {
  if (ruoyiAuthMode) {
    return true
  }
  return Boolean(tenantPickerRef.value?.validate())
}

function toggleRemember() {
  rememberMe.value = !rememberMe.value
}
</script>

<style lang="scss" scoped>
@import './styles/auth.scss';

.login-page {
  background: linear-gradient(180deg, #f8fbff 0%, #f5f8fd 54%, #ffffff 100%);
}

.login-page::before {
  background:
    radial-gradient(circle at 18% 5%, rgba(225, 238, 255, 0.9) 0, rgba(225, 238, 255, 0) 260rpx),
    linear-gradient(180deg, #ffffff 0%, #f5f8fd 100%);
}

.login-page .form-container {
  margin: 0 30rpx;
  padding: 36rpx 32rpx 32rpx;
  border: 1rpx solid #e3ebf7;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 28rpx 70rpx rgba(34, 76, 145, 0.1);
}

.login-page .input-item {
  min-height: 86rpx;
  margin-bottom: 32rpx;
  padding: 0 26rpx;
  border: 1rpx solid #e3ebf7;
  border-radius: 18rpx;
  background: #fbfdff;
}

.login-page :deep(.wd-button.is-block) {
  height: 92rpx;
  border-color: #2f7dff !important;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #2f7dff 0%, #1d6df2 100%) !important;
  box-shadow: 0 18rpx 34rpx rgba(47, 125, 255, 0.28);
}

.login-page :deep(.wd-checkbox__shape) {
  border-color: #2f7dff;
}

.login-page :deep(.is-checked .wd-checkbox__shape),
.login-page :deep(.wd-checkbox__shape.is-checked) {
  border-color: #2f7dff !important;
  background: #ffffff !important;
}

/* 修改选中图标颜色 */
.login-page :deep(.is-checked .wd-checkbox__shape .wd-checkbox__check),
.login-page :deep(.wd-checkbox__shape.is-checked .wd-checkbox__check) {
  color: #2f7dff !important;
}
.auth-visual {
  position: relative;
  z-index: 0;
  padding-top: 74rpx;
  padding-bottom: 30rpx;
}

.visual-card {
  position: relative;
  min-height: 240rpx;
  margin: 0 30rpx;
  overflow: hidden;
  border: 1rpx solid #d9e6fb;
  border-radius: 26rpx;
  background:
    radial-gradient(circle at 82% 36%, rgba(54, 124, 255, 0.14) 0, rgba(54, 124, 255, 0) 220rpx),
    linear-gradient(135deg, #ffffff 0%, #f7fbff 56%, #eff6ff 100%);
  box-shadow: 0 24rpx 58rpx rgba(31, 90, 180, 0.12);
}

.visual-card::before {
  position: absolute;
  top: 12rpx;
  right: 28rpx;
  width: 230rpx;
  height: 230rpx;
  border: 18rpx solid rgba(45, 119, 255, 0.08);
  border-radius: 50%;
  content: '';
}

.visual-card__copy {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: 390rpx;
  padding: 48rpx 42rpx;
}

.visual-brand {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  border: 1rpx solid #dce8ff;
  border-radius: 18rpx;
  background: linear-gradient(145deg, #f3f8ff, #ffffff);
  box-shadow: 0 10rpx 22rpx rgba(43, 117, 255, 0.12);
}

.truck-mark {
  position: relative;
  width: 42rpx;
  height: 32rpx;
}

.truck-box,
.truck-cab {
  position: absolute;
  bottom: 8rpx;
  background: #2f7dff;
}

.truck-box {
  left: 0;
  width: 26rpx;
  height: 20rpx;
  border-radius: 5rpx 3rpx 3rpx 5rpx;
}

.truck-cab {
  right: 0;
  width: 16rpx;
  height: 15rpx;
  border-radius: 3rpx 6rpx 3rpx 2rpx;
}

.truck-cab::before {
  position: absolute;
  top: 3rpx;
  right: 3rpx;
  width: 6rpx;
  height: 5rpx;
  border-radius: 2rpx;
  background: #fff;
  content: '';
}

.truck-wheel {
  position: absolute;
  bottom: 0;
  width: 9rpx;
  height: 9rpx;
  border-radius: 50%;
  background: #1d4ed8;
}

.wheel-a {
  left: 7rpx;
}

.wheel-b {
  right: 4rpx;
}

.visual-kicker {
  color: #2f7dff;
  font-size: 28rpx;
  font-weight: 900;
  letter-spacing: 0;
}

.visual-title {
  margin-top: 42rpx;
  color: #081638;
  font-size: 40rpx;
  font-weight: 900;
  line-height: 1.32;
}

.visual-desc {
  margin-top: 26rpx;
  color: #65738b;
  font-size: 27rpx;
  line-height: 1.45;
}

.visual-clock {
  position: absolute;
  right: 58rpx;
  top: 112rpx;
  width: 188rpx;
  height: 188rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #ffffff, #e6f0ff);
  box-shadow: -16rpx 22rpx 34rpx rgba(52, 104, 195, 0.16);
}

.clock-ring {
  position: absolute;
  inset: -22rpx;
  border: 22rpx solid rgba(47, 125, 255, 0.08);
  border-radius: 50%;
}

.clock-face {
  position: absolute;
  inset: 20rpx;
  border: 8rpx solid #dbe8ff;
  border-radius: 50%;
  background: #f8fbff;
}

.clock-hand {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7rpx;
  border-radius: 999rpx;
  background: #4f8cff;
  transform-origin: center bottom;
}

.clock-hand.hour {
  height: 40rpx;
  transform: translate(-50%, -100%) rotate(4deg);
}

.clock-hand.minute {
  height: 54rpx;
  transform: translate(-50%, -100%) rotate(128deg);
}

.clock-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #2f7dff;
  transform: translate(-50%, -50%);
}

.visual-pin {
  position: absolute;
  right: 44rpx;
  top: 104rpx;
  width: 28rpx;
  height: 28rpx;
  border: 9rpx solid #a9c8ff;
  border-radius: 50% 50% 50% 0;
  opacity: 0.72;
  transform: rotate(-45deg);
}

.visual-path {
  position: absolute;
  right: 26rpx;
  bottom: 54rpx;
  width: 250rpx;
  height: 76rpx;
  border: 4rpx solid rgba(47, 125, 255, 0.08);
  border-left-color: transparent;
  border-radius: 50%;
  transform: rotate(14deg);
}

.form-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 34rpx;
}

.form-title {
  color: #0b2b5c;
  font-size: 46rpx;
  font-weight: 900;
  line-height: 1.14;
}

.form-subtitle {
  margin-top: 10rpx;
  color: #64748b;
  font-size: 28rpx;
}

.social-bind-tip {
  margin-bottom: 24rpx;
  padding: 20rpx 24rpx;
  border: 1rpx solid #dbeafe;
  border-radius: 18rpx;
  color: #2563eb;
  background: #eff6ff;
  font-size: 26rpx;
}

.auth-highlights {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22rpx;
  margin: 0 0 34rpx;
}

.auth-highlight {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  height: 72rpx;
  border: 1rpx solid #e6edf7;
  border-radius: 28rpx;
  color: #18233a;
  background: #f8fbff;
  font-size: 26rpx;
  font-weight: 750;
}

.auth-highlight__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

:deep(.login-button-icon) {
  margin-right: 10rpx;
  vertical-align: -4rpx;
}

.login-options {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 44rpx;
  margin: 2rpx 0 34rpx;
}

.remember-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-width: 0;
  color: #64748b;
  font-size: 26rpx;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
}

// 移除外层胶囊边框，更清爽，弱化视觉
.remember-toggle {
  min-height: auto;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
}

.remember-row :deep(.wd-checkbox) {
  margin: 0;
  // 放开指针事件，点击复选框本身也能触发勾选
  pointer-events: auto;
}

.remember-row :deep(.wd-checkbox__label) {
  display: none;
}

.remember-row :deep(.wd-checkbox__shape) {
  width: 32rpx;
  height: 32rpx;
  border-radius: 8rpx;
}

.forgot-link {
  flex-shrink: 0;
  color: #2f7dff;
  font-size: 26rpx;
  font-weight: 700;
}

.safe-tip {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin: 36rpx 0 52rpx;
  color: #8090aa;
  font-size: 25rpx;
}
</style>
