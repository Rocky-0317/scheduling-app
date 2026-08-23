/* eslint-disable brace-style */
import type {
  AuthLoginReqVO,
  AuthRegisterReqVO,
  AuthSmsLoginReqVO,
  AuthSocialLoginReq,
  ILoginForm,
} from '@/api/login'
import type { AppLatestVersionVo } from '@/api/business'
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
import { businessApi } from '@/api/business'
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
import { getLocalAppVersion } from '@/utils/app'
import {
  APP_UPDATE_PAGE,
  isAppUpdateDismissed,
  isAppUpdateRecentlyAttempted,
  savePendingAppUpdate,
} from '@/utils/appUpdate'

import { useDictStore } from './dict'
import { useUserStore } from './user'

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
let lastAppUpdateCheckAt = 0
const APP_UPDATE_CHECK_INTERVAL = 6 * 60 * 60 * 1000
let refreshTokenPromise: Promise<IAuthLoginRes> | null = null

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

      // 登录或刷新成功后，保存 accessToken 的过期时间。
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

    /**
     * Android 下载并安装 APK。
     *
     * 注意：
     * 1. 普通 Android 应用无法完全静默安装。
     * 2. APK 下载完成后，会调起系统安装页面。
     * 3. 用户仍需要在系统安装页面确认安装。
     */
    function openAndroidUpdatePage(
      versionRes: AppLatestVersionVo,
      localVersion: Awaited<ReturnType<typeof getLocalAppVersion>>,
    ) {
      savePendingAppUpdate({
        ...versionRes,
        localVersionName: localVersion.versionName,
        localVersionCode: localVersion.versionCode,
        detectedAt: Date.now(),
      })

      // 部分旧版 Android WebView 不支持 Array.prototype.at。
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]?.route
      if (`/${currentPage}` === APP_UPDATE_PAGE)
        return

      uni.navigateTo({
        url: APP_UPDATE_PAGE,
        fail: error => console.error('打开 APP 更新页失败', error),
      })
    }
    /**
     * iOS 打开 App Store 或企业分发下载地址。
     */
    function openIosUpdateUrl(downloadUrl: string) {
      // #ifdef APP-PLUS
      plus.runtime.openURL(
        downloadUrl,
        () => {
          console.error('打开 iOS 更新地址失败', downloadUrl)

          uni.showToast({
            title: '无法打开更新地址',
            icon: 'none',
            duration: 2500,
          })
        },
      )
      // #endif

      // #ifndef APP-PLUS
      console.warn('当前环境不是 APP-PLUS，无法打开 APP 更新地址')

      uni.showToast({
        title: '当前环境不支持更新',
        icon: 'none',
        duration: 2500,
      })
      // #endif
    }

    /**
     * 检查 APP 更新。
     *
     * 检测到新版本后：
     * Android：自动下载 APK，并调起系统安装页面。
     * iOS：自动打开 App Store 或配置的下载地址。
     */
    async function checkAppUpdate() {
      // #ifndef APP-PLUS
      return
      // #endif

      if (appUpdateChecking)
        return

      if (Date.now() - lastAppUpdateCheckAt < APP_UPDATE_CHECK_INTERVAL)
        return

      appUpdateChecking = true

      try {
        const systemInfo = uni.getSystemInfoSync() as {
          platform?: string
          uniPlatform?: string
        }

        const localVersion = await getLocalAppVersion()

        if (!localVersion.versionCode) {
          console.error('无法读取 APP versionCode，已取消本次更新检查', localVersion)
          return
        }

        const platform
          = systemInfo.platform?.toLowerCase() === 'ios'
            ? 'ios'
            : 'android'

        const versionRes: AppLatestVersionVo
          = await businessApi.getLatestAppVersion({
            platform,
            currentVersionCode: Number(localVersion.versionCode || 0),

          // 根据业务需要传递以下参数：
          // tenantId: 租户 ID,
          // appName: '外呼调度APP',
          })
        lastAppUpdateCheckAt = Date.now()

        const localVersionCode = Number(localVersion.versionCode || 0)
        const latestVersionCode = Number(versionRes.versionCode || 0)

        // 只有服务端版本号大于本地版本号时才更新。
        const needUpdate = latestVersionCode > localVersionCode

        if (!needUpdate) {
          console.log('当前已经是最新版本', {
            localVersionName: localVersion.versionName,
            localVersionCode,
            latestVersionName: versionRes.versionName,
            latestVersionCode,
          })
          return
        }

        if (!versionRes.downloadUrl) {
          console.warn('检测到新版本，但服务端未配置下载地址', {
            localVersionName: localVersion.versionName,
            localVersionCode,
            latestVersionName: versionRes.versionName,
            latestVersionCode,
            versionRes,
          })
          return
        }

        if (isAppUpdateDismissed(latestVersionCode))
          return

        if (isAppUpdateRecentlyAttempted(latestVersionCode)) {
          console.warn('近期已调起过该版本安装器，跳过重复更新；请确认 APK versionCode 与发布记录一致', {
            localVersionCode,
            latestVersionCode,
          })
          return
        }

        console.log('检测到新版本，开始自动更新', {
          platform,
          localVersionName: localVersion.versionName,
          localVersionCode,
          latestVersionName: versionRes.versionName,
          latestVersionCode,
          downloadUrl: versionRes.downloadUrl,
          forceUpdate: versionRes.forceUpdate,
        })

        if (platform === 'ios') {
          openIosUpdateUrl(versionRes.downloadUrl)
          return
        }

        openAndroidUpdatePage(versionRes, localVersion)
      }
      catch (error) {
        console.error('APP 版本检查异常', error)
      }
      finally {
        appUpdateChecking = false
      }
    }

    async function _postLogin(newTokenInfo: IAuthLoginRes) {
      setTokenInfo(newTokenInfo)

      const userStore = useUserStore()
      await userStore.fetchUserInfo()

      const dictStore = useDictStore()
      void dictStore.loadDictCacheWithRetry()

      // 不阻塞登录成功流程，登录完成后执行版本检查。
      void checkAppUpdate()
    }

    const login = async (loginForm: ILoginForm) => {
      let typeName = ''

      try {
        let res: IAuthLoginRes

        switch (loginForm.type) {
          case 'register': {
            typeName = '注册'
            res = await register(loginForm as AuthRegisterReqVO)
            break
          }

          case 'sms': {
            typeName = '登录'
            res = await smsLogin(loginForm as AuthSmsLoginReqVO)
            break
          }

          default: {
            typeName = '登录'
            res = await _login(loginForm as AuthLoginReqVO)
          }
        }

        await _postLogin(res)

        toast.success(`${typeName}成功`)

        return res
      }
      catch (error) {
        console.error(`${typeName || '登录'}失败:`, error)
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

      lastAppUpdateCheckAt = 0
      refreshTokenPromise = null
      tokenInfo.value = { ...tokenInfoState }

      uni.removeStorageSync('token')
      uni.$emit('auth:logout')

      const userStore = useUserStore()
      userStore.clearUserInfo()

      const dictStore = useDictStore()
      dictStore.clearDictCache()
    }

    const logout = async (
      options: {
        skipRequest?: boolean
      } = {},
    ) => {
      try {
        if (!options.skipRequest)
          await _logout()
      }
      catch (error) {
        console.error('退出登录失败:', error)
      }
      finally {
        clearLocalLoginState()
      }
    }

    const refreshToken = async () => {
      // 所有并发请求共用同一个刷新任务。
      if (refreshTokenPromise)
        return refreshTokenPromise

      if (!isDoubleTokenMode) {
        console.error('单 Token 模式不支持刷新 Token')
        throw new Error('单 Token 模式不支持刷新 Token')
      }

      try {
        if (
          !isDoubleTokenRes(tokenInfo.value)
          || !tokenInfo.value.refreshToken
        ) {
          throw new Error('无效的 refreshToken')
        }

        refreshTokenPromise = _refreshToken(
          tokenInfo.value.refreshToken,
        ).then((res) => {
          setTokenInfo(res)
          return res
        })

        return await refreshTokenPromise
      }
      catch (error) {
        console.error('刷新 Token 失败:', error)
        throw error
      }
      finally {
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

      if (
        !getValidToken.value
        && isDoubleTokenMode
        && !isRefreshTokenExpired.value
      ) {
        try {
          await refreshToken()
          return getValidToken.value
        }
        catch (error) {
          console.error('尝试刷新 Token 失败:', error)
          return ''
        }
      }

      return getValidToken.value
    }

    const ensureAccessToken = async (
      threshold = ACCESS_TOKEN_REFRESH_THRESHOLD,
    ): Promise<string> => {
      updateNowTime()

      if (!hasLoginInfo.value)
        return ''

      if (!isDoubleTokenMode)
        return isTokenExpired.value ? '' : getValidToken.value

      // accessToken 已过期或即将过期时，主动刷新。
      if (
        isTokenExpired.value
        || willAccessTokenExpireSoon(threshold, nowTime.value)
      ) {
        try {
          await refreshToken()
        }
        catch (error) {
          console.error('主动刷新 Token 失败:', error)
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
    }
  },
  {
    persist: true,
  },
)
