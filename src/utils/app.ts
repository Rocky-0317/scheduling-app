/**
 * 获取本地APP版本信息，区分H5调试/APP真机
 */
export async function getLocalAppVersion() {
  const systemInfo = uni.getSystemInfoSync() as UniApp.GetSystemInfoResult & {
    appVersion?: string
    appVersionCode?: string | number
  }
  const fallback = {
    versionName: systemInfo.appVersion || '',
    versionCode: Number(systemInfo.appVersionCode || 0),
  }

  // #ifdef APP-PLUS
  return await new Promise<typeof fallback>((resolve) => {
    let settled = false
    const finish = (value = fallback) => {
      if (settled)
        return
      settled = true
      resolve(value)
    }

    const timeout = setTimeout(() => finish(), 3000)
    plus.runtime.getProperty(plus.runtime.appid, (info) => {
      clearTimeout(timeout)
      finish({
        versionName: info.version || fallback.versionName,
        versionCode: Number(info.versionCode || fallback.versionCode),
      })
    })
  })
  // #endif

  return fallback
}

/**
 * 仅获取文字版本号
 */
export function getLocalAppVersionName(): string {
  const info = uni.getSystemInfoSync() as UniApp.GetSystemInfoResult & { appVersion?: string }
  return info.appVersion || ''
}

/**
 * 仅获取数字版本号
 */
export function getLocalAppVersionCode(): number {
  const info = uni.getSystemInfoSync() as UniApp.GetSystemInfoResult & { appVersionCode?: string | number }
  return Number(info.appVersionCode || 0)
}

/**
 * 完整双维度版本比对
 * @returns -1本地更低(需更新) / 0一致 / 1本地更高
 */
export function compareVersion(localName: string, localCode: number, serverName: string, serverCode: number) {
  // 优先数字版本判断（最精准）
  if (localCode < serverCode)
    return -1
  if (localCode > serverCode)
    return 1

  // 数字相同再比对文字分段
  const localArr = localName.split('.').map(Number)
  const serverArr = serverName.split('.').map(Number)
  const maxLen = Math.max(localArr.length, serverArr.length)
  for (let i = 0; i < maxLen; i++) {
    const l = localArr[i] ?? 0
    const s = serverArr[i] ?? 0
    if (l < s)
      return -1
    if (l > s)
      return 1
  }
  return 0
}
