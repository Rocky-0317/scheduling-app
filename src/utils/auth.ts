import type { IAuthLoginRes } from '@/api/types/login'
import { isDoubleTokenRes, isSingleTokenRes } from '@/api/types/login'

/** 本地保存 access token 过期时间，单位：毫秒时间戳 */
export const ACCESS_TOKEN_EXPIRE_TIME_KEY = 'accessTokenExpireTime'

/** 临近过期主动刷新阈值，默认 2 分钟 */
export const ACCESS_TOKEN_REFRESH_THRESHOLD = 2 * 60 * 1000

function toNumber(value: unknown) {
  const time = Number(value)
  return Number.isFinite(time) ? time : 0
}

/**
 * 统一换算 token 过期时间。
 * 单 token：后端返回 expiresIn 秒，换算为本地绝对时间。
 * 双 token：芋道返回 expiresTime 毫秒时间戳，直接使用。
 */
export function resolveAccessTokenExpireTime(tokenInfo?: IAuthLoginRes | null, now = Date.now()) {
  if (!tokenInfo) {
    return 0
  }
  if (isSingleTokenRes(tokenInfo)) {
    return tokenInfo.expiresIn ? now + tokenInfo.expiresIn * 1000 : 0
  }
  if (isDoubleTokenRes(tokenInfo)) {
    return toNumber(tokenInfo.expiresTime)
  }
  return 0
}

export function saveAccessTokenExpireTime(tokenInfo: IAuthLoginRes, now = Date.now()) {
  const expireTime = resolveAccessTokenExpireTime(tokenInfo, now)
  if (expireTime > 0) {
    uni.setStorageSync(ACCESS_TOKEN_EXPIRE_TIME_KEY, expireTime)
  } else {
    uni.removeStorageSync(ACCESS_TOKEN_EXPIRE_TIME_KEY)
  }
  return expireTime
}

export function getAccessTokenExpireTime() {
  return toNumber(uni.getStorageSync(ACCESS_TOKEN_EXPIRE_TIME_KEY))
}

export function clearAccessTokenExpireTime() {
  uni.removeStorageSync(ACCESS_TOKEN_EXPIRE_TIME_KEY)
}

export function isAccessTokenExpired(now = Date.now()) {
  const expireTime = getAccessTokenExpireTime()
  return !expireTime || now >= expireTime
}

export function willAccessTokenExpireSoon(threshold = ACCESS_TOKEN_REFRESH_THRESHOLD, now = Date.now()) {
  const expireTime = getAccessTokenExpireTime()
  return !expireTime || expireTime - now <= threshold
}

export function getAccessTokenFromTokenInfo(tokenInfo?: IAuthLoginRes | null) {
  if (!tokenInfo) {
    return ''
  }
  if (isSingleTokenRes(tokenInfo)) {
    return tokenInfo.token || ''
  }
  if (isDoubleTokenRes(tokenInfo)) {
    return tokenInfo.accessToken || ''
  }
  return ''
}

export function hasTokenInfo(tokenInfo?: IAuthLoginRes | null) {
  return Boolean(getAccessTokenFromTokenInfo(tokenInfo))
}
