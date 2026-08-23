import type { AppLatestVersionVo } from '@/api/business'

export const APP_UPDATE_STORAGE_KEY = 'pending-app-update'
const APP_UPDATE_DISMISSED_KEY = 'dismissed-app-update'
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
