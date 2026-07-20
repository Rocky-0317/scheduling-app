<template>
  <view class="auth-container">
    <!-- 顶部 -->
    <Header />

    <!-- 表单区域 -->
    <view class="form-container">
      <view class="form-head">
        <view>
          <view class="form-title">
            账号登录
          </view>
          <view class="form-subtitle">
            使用调度系统账号进入工作台
          </view>
        </view>
        <view class="env-chip">
          生产接口
        </view>
      </view>

      <TenantPicker
        v-if="!ruoyiAuthMode"
        ref="tenantPickerRef"
        :disabled="Boolean(socialBindingContext) || authLoading"
        :preferred-tenant-id="socialBindingContext?.tenantId"
      />
      <view v-if="socialBindingContext" class="mb-24rpx rounded-12rpx bg-[#e8f4ff] px-24rpx py-20rpx text-26rpx text-[#1890ff]">
        三方授权成功，请使用账号密码登录完成绑定
      </view>
      <view class="input-item">
        <wd-icon name="user" size="20px" color="#0f766e" />
        <wd-input
          v-model="formData.username"
          placeholder="请输入账号"
          clearable
          clear-trigger="focus"
        />
      </view>
      <view class="input-item">
        <wd-icon name="lock" size="20px" color="#0f766e" />
        <wd-input
          v-model="formData.password"
          placeholder="请输入密码"
          clearable
          clear-trigger="focus"
          show-password
        />
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

      <!-- 登录按钮 -->
      <wd-button block :disabled="authLoading" :loading="loading" type="primary" @click="handleLogin">
        登录工作台
      </wd-button>

      <view class="login-meta">
        <view>
          <text class="meta-label">服务地址</text>
          <text class="meta-value">8.163.84.171:8000/prod-api</text>
        </view>
        <view>
          <text class="meta-label">认证方式</text>
          <text class="meta-value">账号密码登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SocialLoginBindingContext } from '@/utils/social-login'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, reactive, ref } from 'vue'
import { useTokenStore } from '@/store/token'
import { ensureDecodeURIComponent, redirectAfterLogin } from '@/utils'
import Header from './components/header.vue'
import TenantPicker from './components/tenant-picker.vue'
import Verify from './components/verifition/verify.vue'

defineOptions({
  name: 'LoginPage',
  style: {
    navigationStyle: 'custom',
  },
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
const loading = ref(false) // 表单提交状态
const redirectUrl = ref(pageProps.redirect ? ensureDecodeURIComponent(pageProps.redirect) : undefined) // 重定向地址
const tenantPickerRef = ref<InstanceType<typeof TenantPicker>>() // 租户选择器引用
const captchaEnabled = import.meta.env.VITE_APP_CAPTCHA_ENABLE === 'true' // 验证码开关
const ruoyiAuthMode = true
const verifyRef = ref()
const captchaType = ref('blockPuzzle') // 滑块验证码 blockPuzzle|clickWord

const formData = reactive({
  username: import.meta.env.VITE_APP_DEFAULT_LOGIN_USERNAME || '',
  password: import.meta.env.VITE_APP_DEFAULT_LOGIN_PASSWORD || '',
  code: '',
  uuid: '',
  captchaVerification: '', // 验证码校验值
}) // 表单数据
const socialBindingContext = ref<SocialLoginBindingContext>() // 待绑定的三方授权上下文
const socialLoginLoading = ref(false) // 保留状态，兼容三方绑定回跳参数
const authLoading = computed(() => loading.value || socialLoginLoading.value) // 任一登录流程进行状态
const socialAuth = computed(() => { // 待绑定的三方授权参数
  const context = socialBindingContext.value
  return context
    ? {
        socialType: context.socialType,
        socialCode: context.socialCode,
        socialState: context.socialState,
      }
    : undefined
})

/** 获取验证码 */
async function getCode() {
  // 情况一，未开启：则直接登录
  if (!captchaEnabled) {
    await verifySuccess({})
  } else {
    // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行登录
    // 弹出验证码
    verifyRef.value.show()
  }
}

/** 登录处理 */
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

/** 验证成功后登录 */
async function verifySuccess(params: any) {
  loading.value = true
  try {
    // 调用登录接口
    const tokenStore = useTokenStore()
    formData.captchaVerification = params.captchaVerification
    await tokenStore.login({
      type: 'username',
      ...formData,
      ...socialAuth.value,
    })
    // 处理跳转
    redirectAfterLogin(socialBindingContext.value?.redirect || redirectUrl.value)
  } finally {
    loading.value = false
  }
}

/** 校验当前租户 */
function validateTenant() {
  if (ruoyiAuthMode) {
    return true
  }
  return Boolean(tenantPickerRef.value?.validate())
}
</script>

<style lang="scss" scoped>
@import './styles/auth.scss';

.form-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 28rpx;
}

.form-title {
  color: #0f172a;
  font-size: 34rpx;
  font-weight: 800;
}

.form-subtitle {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 24rpx;
}

.env-chip {
  flex-shrink: 0;
  padding: 8rpx 14rpx;
  border: 1rpx solid #bbddd6;
  border-radius: 8rpx;
  color: #0f766e;
  background: #effaf7;
  font-size: 22rpx;
  font-weight: 650;
}

.login-meta {
  display: grid;
  gap: 14rpx;
  margin-top: 28rpx;
  padding: 22rpx;
  border: 1rpx solid #e2e8f0;
  border-radius: 8rpx;
  background: #f8fafc;

  view {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
  }
}

.meta-label {
  flex-shrink: 0;
  color: #64748b;
  font-size: 23rpx;
}

.meta-value {
  min-width: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 23rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
