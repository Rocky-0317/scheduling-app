import type { AppLatestVersionVo } from '@/api/business'

export const APP_UPDATE_STORAGE_KEY = 'pending-app-update'
const APP_UPDATE_DISMISSED_KEY = 'dismissed-app-update'
const APP_UPDATE_ATTEMPTED_KEY = 'attempted-app-update'
export const APP_UPDATE_PAGE = '/pages-core/app-update/index'

export interface PendingAppUpdate extends AppLatestVersionVo {
  localVersionName: string
  localVersionCode: number
  detectedAt: number
}

export function savePendingAppUpdate(update: PendingAppUpdate) {
  uni.setStorageSync(APP_UPDATE_STORAGE_KEY, update)
}

export function getPendingAppUpdate(): PendingAppUpdate | null {
  const value = uni.getStorageSync(APP_UPDATE_STORAGE_KEY)
  return value && typeof value === 'object' ? value as PendingAppUpdate : null
}

export function clearPendingAppUpdate() {
  uni.removeStorageSync(APP_UPDATE_STORAGE_KEY)
}

export function dismissAppUpdate(versionCode: number) {
  uni.setStorageSync(APP_UPDATE_DISMISSED_KEY, {
    versionCode,
    dismissedAt: Date.now(),
  })
}

export function isAppUpdateDismissed(versionCode: number, duration = 24 * 60 * 60 * 1000) {
  const value = uni.getStorageSync(APP_UPDATE_DISMISSED_KEY) as { versionCode?: number, dismissedAt?: number } | null
  return Number(value?.versionCode) === versionCode
    && Date.now() - Number(value?.dismissedAt || 0) < duration
}

/**
 * 记录已经成功调起过系统安装器的版本。
 *
 * 系统安装器的返回不代表用户一定完成了覆盖安装；短期记录可以避免用户
 * 取消安装、安装器返回旧进程或 APK 版本配置错误时立即再次进入更新页。
 */
export function markAppUpdateAttempted(versionCode: number) {
  uni.setStorageSync(APP_UPDATE_ATTEMPTED_KEY, {
    versionCode,
    attemptedAt: Date.now(),
  })
}

export function isAppUpdateRecentlyAttempted(versionCode: number, duration = 24 * 60 * 60 * 1000) {
  const value = uni.getStorageSync(APP_UPDATE_ATTEMPTED_KEY) as { versionCode?: number, attemptedAt?: number } | null
  return Number(value?.versionCode) === versionCode
    && Date.now() - Number(value?.attemptedAt || 0) < duration
}
