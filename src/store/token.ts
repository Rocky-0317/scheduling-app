/* eslint-disable brace-style */
import type {
  AuthLoginReqVO,
  AuthRegisterReqVO,
  AuthSmsLoginReqVO,
  AuthSocialLoginReq,
  ILoginForm,
} from '@/api/login'
import type { IAuthLoginRes } from '@/api/types/login'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  login as _login,
  logout as _logout,
  refreshToken as _refreshToken,
  socialLogin as _socialLogin,
  register,
  smsLogin,
} from '@/api/login'
import { isDoubleTokenRes } from '@/api/types/login'
import { isDoubleTokenMode } from '@/utils'
import {
  ACCESS_TOKEN_REFRESH_THRESHOLD,
  clearAccessTokenExpireTime,
  getAccessTokenExpireTime,
  getAccessTokenFromTokenInfo,
  hasTokenInfo,
  isAccessTokenExpired,
  saveAccessTokenExpireTime,
  willAccessTokenExpireSoon,
} from '@/utils/auth'
import { useDictStore } from './dict'
import { useUserStore } from './user'
import { businessApi } from '@/api/business'
import type { AppLatestVersionVo } from '@/api/business'
// 导入统一版本工具
import { getLocalAppVersion } from '@/utils/app'

const tokenInfoState = isDoubleTokenMode
  ? {
      accessToken: '',
      refreshToken: '',
      expiresTime: 0,
    }
  : {
      token: '',
      expiresIn: 0,
    }

let appUpdateChecking = false
let refreshTokenPromise: Promise<IAuthLoginRes> | null = null
// 缓存已跳过的版本，非强制更新不再重复弹窗
const skipForceUpdateVersion = ref('')

export const useTokenStore = defineStore(
  'token',
  () => {
    const toast = useToast()
    const tokenInfo = ref<IAuthLoginRes>({ ...tokenInfoState })
    const nowTime = ref(Date.now())

    const updateNowTime = () => {
      nowTime.value = Date.now()
      return useTokenStore()
    }

    const setTokenInfo = (val: IAuthLoginRes) => {
      updateNowTime()
      tokenInfo.value = val
      // 登录或刷新成功后统一保存 access token 过期时间，路由和请求都基于它做本地鉴权。
      saveAccessTokenExpireTime(val)
    }

    const isTokenExpired = computed(() => {
      if (!hasTokenInfo(tokenInfo.value))
        return true
      return isAccessTokenExpired(nowTime.value)
    })

    const isRefreshTokenExpired = computed(() => {
      if (!isDoubleTokenMode)
        return true
      return false
    })

    async function checkAppUpdate() {
      if (appUpdateChecking)
        return
      appUpdateChecking = true
      try {
        const localVer = getLocalAppVersion()
        const systemInfo = uni.getSystemInfoSync() as any
        if (systemInfo.uniPlatform !== 'app') {
          return
        }

        const platform = systemInfo.platform === 'ios' ? 'ios' : 'android'
        const versionRes: AppLatestVersionVo = await businessApi.getLatestAppVersion({
          platform,
          currentVersionCode: localVer.versionCode,
          // 下面两个根据你业务按需开启
          // tenantId: 租户ID,
          // appName: "外呼调度APP"
        })

        const latestVersion = versionRes.versionName
        const needUpdate = localVer.versionName !== versionRes.versionName
          || localVer.versionCode !== versionRes.versionCode
        if (!needUpdate) {
          return
        }
        if (!versionRes.forceUpdate && skipForceUpdateVersion.value === latestVersion) {
          return
        }
        if (!versionRes.apkDownloadUrl) {
          console.warn('检测到新版本，但缺少 APP 下载地址', versionRes)
          return
        }

        setTimeout(() => {
          uni.$emit('app:openUpdatePopup', {
            latestVersion,
            localVersion: localVer.versionName,
            updateTitle: versionRes.updateTitle || '发现新版本',
            updateContent: versionRes.updateContent || '请更新到最新版本后继续使用',
            downloadUrl: versionRes.apkDownloadUrl,
            forceUpdate: versionRes.forceUpdate,
            onSkip: () => {
              skipForceUpdateVersion.value = latestVersion
            },
          })
        }, 300)
      } catch (e) {
        console.error('APP 版本检查异常', e)
      } finally {
        appUpdateChecking = false
      }
    }

    async function _postLogin(tokenInfo: IAuthLoginRes) {
      setTokenInfo(tokenInfo)
      const userStore = useUserStore()
      await userStore.fetchUserInfo()
      const dictStore = useDictStore()
      void dictStore.loadDictCacheWithRetry()
      await checkAppUpdate()
    }

    const login = async (loginForm: ILoginForm) => {
      let typeName = ''
      try {
        let res: IAuthLoginRes
        switch (loginForm.type) {
          case 'register': {
            res = await register(loginForm as AuthRegisterReqVO)
            typeName = '注册'
            break
          }
          case 'sms': {
            res = await smsLogin(loginForm as AuthSmsLoginReqVO)
            typeName = '登录'
            break
          }
          default: {
            res = await _login(loginForm as AuthLoginReqVO)
            typeName = '登录'
          }
        }
        await _postLogin(res)
        toast.success(`${typeName}成功`)
        return res
      }
      catch (error) {
        console.error(`${typeName}失败:`, error)
        throw error
      }
    }

    const socialLogin = async (data: AuthSocialLoginReq) => {
      const res = await _socialLogin(data)
      await _postLogin(res)
      toast.success('登录成功')
      return res
    }

    function clearLocalLoginState() {
      updateNowTime()
      clearAccessTokenExpireTime()
      refreshTokenPromise = null
      tokenInfo.value = { ...tokenInfoState }
      uni.removeStorageSync('token')
      uni.$emit('auth:logout')
      const userStore = useUserStore()
      userStore.clearUserInfo()
      const dictStore = useDictStore()
      dictStore.clearDictCache()
    }

    const logout = async (options: { skipRequest?: boolean } = {}) => {
      try {
        if (!options.skipRequest) {
          await _logout()
        }
      }
      catch (error) {
        console.error('退出登录失败:', error)
      }
      finally {
        clearLocalLoginState()
      }
    }

    const refreshToken = async () => {
      // One refresh request is shared by all concurrent callers.
      if (refreshTokenPromise) {
        return refreshTokenPromise
      }
      if (!isDoubleTokenMode) {
        console.error('单token模式不支持刷新token')
        throw new Error('单token模式不支持刷新token')
      }
      try {
        if (!isDoubleTokenRes(tokenInfo.value) || !tokenInfo.value.refreshToken) {
          throw new Error('无效的refreshToken')
        }
        refreshTokenPromise = _refreshToken(tokenInfo.value.refreshToken)
          .then((res) => {
            setTokenInfo(res)
            return res
          })
        return await refreshTokenPromise
      }
      catch (error) {
        console.error('刷新token失败:', error)
        throw error
      } finally {
        refreshTokenPromise = null
        updateNowTime()
      }
    }

    const getValidToken = computed(() => {
      if (isTokenExpired.value)
        return ''
      return getAccessTokenFromTokenInfo(tokenInfo.value)
    })

    const hasLoginInfo = computed(() => {
      return hasTokenInfo(tokenInfo.value)
    })

    const hasValidLogin = computed(() => {
      return hasLoginInfo.value && !isTokenExpired.value
    })

    const tryGetValidToken = async (): Promise<string> => {
      updateNowTime()
      if (!getValidToken.value && isDoubleTokenMode && !isRefreshTokenExpired.value) {
        try {
          await refreshToken()
          return getValidToken.value
        } catch (error) {
          console.error('尝试刷新token失败:', error)
          return ''
        }
      }
      return getValidToken.value
    }

    const ensureAccessToken = async (threshold = ACCESS_TOKEN_REFRESH_THRESHOLD): Promise<string> => {
      updateNowTime()
      if (!hasLoginInfo.value) {
        return ''
      }
      if (!isDoubleTokenMode) {
        return isTokenExpired.value ? '' : getValidToken.value
      }
      // Refresh before sending requests when access token has expired or will expire soon.
      if (isTokenExpired.value || willAccessTokenExpireSoon(threshold, nowTime.value)) {
        try {
          await refreshToken()
        } catch (error) {
          console.error('涓诲姩鍒锋柊token澶辫触:', error)
          return ''
        }
      }
      updateNowTime()
      return getValidToken.value
    }

    return {
      login,
      socialLogin,
      logout,
      clearLocalLoginState,
      hasLogin: hasValidLogin,
      refreshToken,
      ensureAccessToken,
      tryGetValidToken,
      validToken: getValidToken,
      tokenInfo,
      setTokenInfo,
      updateNowTime,
      accessTokenExpireTime: getAccessTokenExpireTime,
      checkAppUpdate,
      skipForceUpdateVersion,
    }
  },
  {
    persist: true,
  },
)
