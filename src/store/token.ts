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
let appUpdateDownloading = false
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
    function downloadAndInstallAndroid(downloadUrl: string) {
      if (appUpdateDownloading)
        return

      appUpdateDownloading = true

      let lastProgress = -1

      uni.showLoading({
        title: '准备下载更新',
        mask: true,
      })

      const downloadTask = uni.downloadFile({
        url: downloadUrl,

        success: (downloadRes) => {
          uni.hideLoading()

          if (downloadRes.statusCode !== 200) {
            console.error('APK 下载失败：HTTP 状态码异常', downloadRes)

            uni.showToast({
              title: '更新包下载失败',
              icon: 'none',
              duration: 2500,
            })

            appUpdateDownloading = false
            return
          }

          if (!downloadRes.tempFilePath) {
            console.error('APK 下载失败：临时文件路径为空', downloadRes)

            uni.showToast({
              title: '更新包文件无效',
              icon: 'none',
              duration: 2500,
            })

            appUpdateDownloading = false
            return
          }

          console.log('APK 下载完成，准备安装', {
            tempFilePath: downloadRes.tempFilePath,
          })

          // #ifdef APP-PLUS
          plus.runtime.install(
            downloadRes.tempFilePath,
            {
              force: false,
            },
            () => {
              console.log('新版 APP 安装完成')

              appUpdateDownloading = false

              uni.showToast({
                title: '更新完成，正在重启',
                icon: 'none',
                duration: 1500,
              })

              setTimeout(() => {
                plus.runtime.restart()
              }, 1500)
            },
            (installError) => {
              console.error('安装更新失败', installError)

              appUpdateDownloading = false

              uni.showToast({
                title: '安装更新失败',
                icon: 'none',
                duration: 2500,
              })
            },
          )
          // #endif

          // #ifndef APP-PLUS
          appUpdateDownloading = false

          console.warn('当前环境不是 APP-PLUS，无法安装 APK')

          uni.showToast({
            title: '当前环境不支持安装',
            icon: 'none',
            duration: 2500,
          })
          // #endif
        },

        fail: (downloadError) => {
          uni.hideLoading()

          console.error('下载更新包失败', downloadError)

          appUpdateDownloading = false

          uni.showToast({
            title: '更新包下载失败',
            icon: 'none',
            duration: 2500,
          })
        },

        complete: () => {
          uni.hideLoading()
        },
      })

      downloadTask.onProgressUpdate((progressInfo) => {
        const progress = Number(progressInfo.progress || 0)

        // 防止同一个进度重复刷新 loading。
        if (progress === lastProgress)
          return

        lastProgress = progress

        uni.showLoading({
          title: `正在更新 ${progress}%`,
          mask: true,
        })

        console.log('更新包下载进度', {
          progress,
          totalBytesWritten: progressInfo.totalBytesWritten,
          totalBytesExpectedToWrite:
          progressInfo.totalBytesExpectedToWrite,
        })
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
      if (appUpdateChecking || appUpdateDownloading)
        return

      appUpdateChecking = true

      try {
        const systemInfo = uni.getSystemInfoSync() as {
          platform?: string
          uniPlatform?: string
        }

        // 允许所有运行环境执行版本检查，便于 H5/小程序等环境调试后端版本接口。

        const localVersion = getLocalAppVersion()

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

        downloadAndInstallAndroid(versionRes.downloadUrl)
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
