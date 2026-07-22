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
import { isDoubleTokenRes, isSingleTokenRes } from '@/api/types/login'
import { isDoubleTokenMode } from '@/utils'
import { useDictStore } from './dict'
import { useUserStore } from './user'
import { getNotice, listNoticeTop } from '@/api/system/notice'
import type { SysNotice } from '@/api/system/notice'
import { businessApi } from '@/api/business'
import type { AppLatestVersionVo } from '@/api/business'
// 导入统一版本工具
import { compareVersion, getLocalAppVersion } from '@/utils/app'

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

let noticeLoading = false
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
      const now = Date.now()
      if (isSingleTokenRes(val)) {
        const expireTime = now + val.expiresIn * 1000
        uni.setStorageSync('accessTokenExpireTime', expireTime)
      } else if (isDoubleTokenRes(val)) {
        uni.setStorageSync('accessTokenExpireTime', val.expiresTime)
      }
    }

    const isTokenExpired = computed(() => {
      if (!tokenInfo.value)
        return true
      const now = nowTime.value
      const expireTime = uni.getStorageSync('accessTokenExpireTime')
      if (!expireTime)
        return true
      return now >= expireTime
    })

    const isRefreshTokenExpired = computed(() => {
      if (!isDoubleTokenMode)
        return true
      return false
    })

    async function loadAppUnreadNotice() {
      if (noticeLoading)
        return
      noticeLoading = true
      try {
        const topRes = await listNoticeTop()
        const allTopList: SysNotice[] = topRes || []
        const unreadList = allTopList.filter(item => item.noticeType === '2' && item.isRead === false)
        for (let i = 0; i < unreadList.length; i++) {
          const fullDetail = await getNotice(unreadList[i].noticeId!)
          unreadList[i] = fullDetail
        }

        let needUpdate = false
        let latestVersion = ''
        let downloadUrl = ''
        let forceUpdate = false
        const localVer = getLocalAppVersion()
        let versionRes: AppLatestVersionVo

        // APP环境：请求后端真实版本接口，补齐必填参数
        // #ifdef APP-PLUS
        versionRes = await businessApi.getLatestAppVersion({
          platform: 'android',
          currentVersionCode: localVer.versionCode,
          // 下面两个根据你业务按需开启
          // tenantId: 租户ID,
          // appName: "外呼调度APP"
        })
        // #endif

        // H5本地调试：内置模拟新版本，无需启动后端即可测试更新弹窗
        // #ifdef H5
        versionRes = {
          versionName: '2.1.0',
          versionCode: 210,
          apkDownloadUrl: 'https://demo-apk.test.com/app-v2.1.0.apk',
          forceUpdate: true,
        }
        // #endif

        latestVersion = versionRes.versionName
        downloadUrl = versionRes.apkDownloadUrl ?? ''
        forceUpdate = versionRes.forceUpdate

        // 双维度比对版本
        const diff = compareVersion(localVer.versionName, localVer.versionCode, versionRes.versionName, versionRes.versionCode)
        needUpdate = diff < 0

        // 非强制更新，用户点击稍后则缓存版本不再弹窗
        if (needUpdate && !forceUpdate && skipForceUpdateVersion.value === latestVersion) {
          needUpdate = false
        }

        console.log('未读公告数量', unreadList.length, '是否需要更新', needUpdate)
        if (unreadList.length > 0 || needUpdate) {
          setTimeout(() => {
            uni.$emit('app:openUnreadNoticePopup', {
              noticeList: unreadList,
              needUpdate,
              latestVersion,
              downloadUrl,
              forceUpdate,
            })
          }, 300)
        }
      } catch (e) {
        console.error('公告/版本加载异常', e)
      } finally {
        noticeLoading = false
      }
    }

    async function _postLogin(tokenInfo: IAuthLoginRes) {
      setTokenInfo(tokenInfo)
      const userStore = useUserStore()
      await userStore.fetchUserInfo()
      const dictStore = useDictStore()
      void dictStore.loadDictCacheWithRetry()
      await loadAppUnreadNotice()
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

    const logout = async () => {
      try {
        await _logout()
      }
      catch (error) {
        console.error('退出登录失败:', error)
      }
      finally {
        updateNowTime()
        uni.removeStorageSync('accessTokenExpireTime')
        tokenInfo.value = { ...tokenInfoState }
        uni.removeStorageSync('token')
        uni.$emit('auth:logout')
        const userStore = useUserStore()
        userStore.clearUserInfo()
        const dictStore = useDictStore()
        dictStore.clearDictCache()
      }
    }

    const refreshToken = async () => {
      if (!isDoubleTokenMode) {
        console.error('单token模式不支持刷新token')
        throw new Error('单token模式不支持刷新token')
      }
      try {
        if (!isDoubleTokenRes(tokenInfo.value) || !tokenInfo.value.refreshToken) {
          throw new Error('无效的refreshToken')
        }
        const res = await _refreshToken(tokenInfo.value.refreshToken)
        setTokenInfo(res)
        return res
      }
      catch (error) {
        console.error('刷新token失败:', error)
        throw error
      } finally {
        updateNowTime()
      }
    }

    const getValidToken = computed(() => {
      if (isTokenExpired.value)
        return ''
      if (!isDoubleTokenMode) {
        return isSingleTokenRes(tokenInfo.value) ? tokenInfo.value.token : ''
      } else {
        return isDoubleTokenRes(tokenInfo.value) ? tokenInfo.value.accessToken : ''
      }
    })

    const hasLoginInfo = computed(() => {
      if (!tokenInfo.value)
        return false
      if (isDoubleTokenMode) {
        return (isDoubleTokenRes(tokenInfo.value) && !!tokenInfo.value.accessToken)
          || (isSingleTokenRes(tokenInfo.value) && !!tokenInfo.value.token)
      } else {
        return isSingleTokenRes(tokenInfo.value) && !!tokenInfo.value.token
      }
    })

    const hasValidLogin = computed(() => {
      if (isDoubleTokenMode)
        return hasLoginInfo.value
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

    return {
      login,
      socialLogin,
      logout,
      hasLogin: hasValidLogin,
      refreshToken,
      tryGetValidToken,
      validToken: getValidToken,
      tokenInfo,
      setTokenInfo,
      updateNowTime,
      skipForceUpdateVersion,
    }
  },
  {
    persist: true,
  },
)
