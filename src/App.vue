<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { navigateToInterceptor } from '@/router/interceptor'
import { useDictStore, useTokenStore } from '@/store'
import { hasTokenInfo, isAccessTokenExpired } from '@/utils/auth'
import { toLoginPage } from '@/utils/toLoginPage'

function getAppShowUrl(options?: any) {
  return options?.path ? `/${options.path}` : '/'
}

function runGlobalAuthGuard(options?: any) {
  const tokenStore = useTokenStore().updateNowTime()
  const url = getAppShowUrl(options)
  // App 启动和切回前台时先做本地过期校验，过期 token 不再放行业务页面首屏。
  if (hasTokenInfo(tokenStore.tokenInfo) && isAccessTokenExpired()) {
    uni.showLoading({
      title: '登录状态校验中',
      mask: true,
    })
    tokenStore.clearLocalLoginState()
    setTimeout(() => {
      uni.hideLoading()
      navigateToInterceptor.invoke({ url, query: options?.query })
    }, 0)
    return false
  }
  const allow = navigateToInterceptor.invoke({ url, query: options?.query })
  if (allow === false) {
    setTimeout(() => {
      toLoginPage.flush()
    }, 0)
  }
  return allow !== false
}

onLaunch((options) => {
  runGlobalAuthGuard(options)
  console.log('App初始化', options)
})

onShow((options) => {
  console.log('App.vue onShow', options)
  const tokenStore = useTokenStore()
  const dictStore = useDictStore()
  const passedAuthGuard = runGlobalAuthGuard(options)
  if (!passedAuthGuard)
    return

  if (tokenStore.updateNowTime().hasLogin) {
    if (!dictStore.isLoaded)
      dictStore.loadDictCache()

    // 冷启动、登录后及切回前台时都会触发，Store 内部会做并发和六小时节流。
    void tokenStore.checkAppUpdate()
  }
})

onHide(() => {
  console.log('App 切后台')
})
</script>
