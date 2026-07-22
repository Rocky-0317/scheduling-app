/**
 * 获取本地APP版本信息，区分H5调试/APP真机
 */
export function getLocalAppVersion() {
  // H5浏览器调试，模拟低版本本地包，方便测试更新弹窗
  // #ifdef H5
  return {
    versionName: '1.0.0',
    versionCode: 100,
  }
  // #endif

  // APP模拟器/真机，读取打包manifest真实版本
  // #ifdef APP-PLUS
  const info = uni.getAppInfo()
  return {
    versionName: info.versionName || '1.0.0',
    versionCode: Number(info.versionCode) || 100,
  }
  // #endif
}

/**
 * 仅获取文字版本号
 */
export function getLocalAppVersionName(): string {
  return getLocalAppVersion().versionName
}

/**
 * 仅获取数字版本号
 */
export function getLocalAppVersionCode(): number {
  return getLocalAppVersion().versionCode
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
