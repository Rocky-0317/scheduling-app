<template>
  <view class="yd-page-container yd-page-container-paging business-list">
    <wd-navbar :title="config.title" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <view class="list-tools" :class="{ 'person-tools': isModernModule }">
      <template v-if="isModernModule">
        <view class="person-search-box">
          <wd-icon name="search-line" size="32rpx" color="#9aa9bd" @click="submitQuickSearch" />
          <input
            v-model="quickKeyword"
            class="person-search-input"
            confirm-type="search"
            :placeholder="quickSearchPlaceholder"
            placeholder-class="person-search-placeholder"
            @confirm="submitQuickSearch"
          >
          <wd-icon v-if="quickKeyword" name="close" size="28rpx" color="#9aa9bd" @click="clearQuickSearch" />
        </view>
        <view class="person-filter-btn" @click="openSearch">
          <wd-icon name="filter" size="30rpx" color="#475569" />
          <text>筛选</text>
          <view v-if="activeSearchCount" class="filter-count person-filter-count">
            {{ activeSearchCount }}
          </view>
        </view>
      </template>
      <view v-else class="filter-entry" @click="openSearch">
        <wd-icon name="filter" size="34rpx" color="#2f7dff" />
        <text class="filter-title">{{ searchPlaceholder }}</text>
        <view v-if="activeSearchCount" class="filter-count">
          {{ activeSearchCount }}
        </view>
      </view>
      <wd-button v-if="activeSearchCount" size="small" plain @click="resetSearch">
        <wd-icon name="delete" size="24rpx" color="#475569" custom-class="button-icon" />
        清空
      </wd-button>
      <wd-button v-if="isTimeoutModule" size="small" type="primary" plain @click="openTimeoutConfig">
        <wd-icon name="settings" size="24rpx" color="#2f7dff" custom-class="button-icon" />
        设置
      </wd-button>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      :empty-view-text="`暂无${config.title}数据`"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="getItemId(item) || item.recordId || item.customerNumber"
          class="record-card"
          :class="{ 'person-card': isModernModule }"
        >
          <view class="record-head" @click="tryOpenDetail(item)">
            <view v-if="isModernModule" class="person-profile">
              <view class="person-avatar" :class="{ 'person-avatar--package': isPackageModule }">
                <view v-if="isPackageModule" class="package-mark package-mark--avatar">
                  <view class="package-mark__box" />
                  <view class="package-mark__lid" />
                  <view class="package-mark__tape" />
                </view>
                <wd-icon v-else :name="getModuleAvatarIcon()" size="42rpx" color="#2f7dff" />
              </view>
              <view class="person-title-wrap">
                <view class="person-title-line">
                  <view class="record-title person-name">
                    {{ getValue(item, config.primaryKey) || '-' }}
                  </view>
                  <wd-tag v-if="config.badgeKey" custom-class="person-status-tag" :type="getStatusType(config.badgeKey, item[config.badgeKey], config.badgeOptions)" plain>
                    {{ getStatusLabel(config.badgeKey, item[config.badgeKey], config.badgeOptions) }}
                  </wd-tag>
                </view>
              </view>
            </view>
            <view v-else class="record-title">
              {{ getValue(item, config.primaryKey) || '-' }}
            </view>
            <wd-tag v-if="config.badgeKey && !isModernModule" :type="getStatusType(config.badgeKey, item[config.badgeKey], config.badgeOptions)" plain>
              {{ getStatusLabel(config.badgeKey, item[config.badgeKey], config.badgeOptions) }}
            </wd-tag>
          </view>

          <view class="record-body" :class="{ 'person-body': isModernModule }" @click="tryOpenDetail(item)">
            <view
              v-for="key in getSecondaryKeys(item)"
              :key="key"
              class="record-line"
              :class="{ 'person-line': isModernModule, 'person-line--wide': isWidePersonField(key) }"
            >
              <view v-if="isModernModule" class="person-line-icon">
                <wd-icon :name="getFieldIcon(key)" size="28rpx" color="#7890ad" />
              </view>
              <text class="record-label">{{ getFieldLabel(key) }}</text>
              <text class="record-text">{{ formatValue(item[key], key) }}</text>
            </view>
          </view>

          <scroll-view v-if="item.imageUrls?.length" scroll-x class="image-strip">
            <image
              v-for="url in item.imageUrls"
              :key="url"
              :src="getImageUrl(url)"
              mode="aspectFill"
              class="record-image"
              @click="previewImage(item.imageUrls, url)"
            />
          </scroll-view>

          <view v-if="isModernModule && config.remove" class="person-card-actions">
            <view class="person-delete-button" @click.stop="removeItem(item)">
              删除
            </view>
          </view>

          <view v-if="!isModernModule" class="record-actions">
            <wd-button v-if="canOpenDetail(item)" size="small" plain @click="openDetail(item)">
              <wd-icon name="search-line" size="24rpx" color="#475569" custom-class="button-icon" />
              详情
            </wd-button>
            <wd-button v-if="canEdit" size="small" type="success" plain @click="openForm(item)">
              <wd-icon name="edit" size="24rpx" color="#16a34a" custom-class="button-icon" />
              编辑
            </wd-button>
            <wd-button v-if="config.claim && item.assignmentStatus === '1'" size="small" type="primary" plain @click="claimRecord(item)">
              <wd-icon name="check-circle" size="24rpx" color="#2f7dff" custom-class="button-icon" />
              领取
            </wd-button>
            <wd-button v-if="config.uploadImages && getItemId(item)" size="small" type="info" plain @click="uploadImages(item)">
              <wd-icon name="arrow-right" size="24rpx" color="#0891b2" custom-class="button-icon" />
              上传图片
            </wd-button>
            <wd-button v-if="config.remove" size="small" plain @click="removeItem(item)">
              <wd-icon name="delete" size="24rpx" color="#dc2626" custom-class="button-icon" />
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <wd-fab v-if="config.canCreate" position="right-bottom" type="primary" :expandable="false" @click="openCreate" />

    <wd-popup v-model="timeoutConfigVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="config-panel">
        <view class="config-title">
          超时提醒设置
        </view>
        <view class="config-row">
          <text>启用提醒</text>
          <wd-switch v-model="timeoutConfig.status" :active-value="1" :inactive-value="0" />
        </view>
        <view class="config-row align-start">
          <text>超时时间</text>
          <view class="config-input">
            <wd-input-number v-model="timeoutConfig.timeoutDays" :min="1" :precision="0" />
            <text class="config-unit">分钟</text>
          </view>
        </view>
        <view class="config-actions">
          <wd-button class="flex-1" plain @click="timeoutConfigVisible = false">
            <wd-icon name="close" size="26rpx" color="#475569" custom-class="button-icon" />
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="timeoutSaving" @click="saveTimeoutConfig">
            <wd-icon name="check-circle" size="26rpx" color="#fff" custom-class="button-icon" />
            保存
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <wd-popup v-model="searchVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="search-panel" :class="{ 'person-search-panel': isModernModule }">
        <view class="search-head">
          <view>
            <view class="search-title">
              {{ isModernModule ? '高级筛选' : `筛选${config.title}` }}
            </view>
            <view class="search-subtitle">
              {{ isModernModule ? `组合条件定位${config.title}` : '填写条件后按列表查询' }}
            </view>
          </view>
          <wd-icon name="close" size="34rpx" color="#64748b" @click="searchVisible = false" />
        </view>
        <view v-for="field in config.searchFields" :key="field.key" class="search-item" :class="{ 'person-search-item': isModernModule }">
          <view class="search-label">
            {{ field.label }}
          </view>
          <wd-radio-group v-if="field.type === 'radio'" v-model="searchForm[field.key]" type="button" :class="{ 'person-radio-group': isModernModule }">
            <wd-radio value="">
              全部
            </wd-radio>
            <wd-radio v-for="option in field.options" :key="option.value" :value="option.value">
              {{ option.label }}
            </wd-radio>
          </wd-radio-group>
          <wd-input v-else v-model="searchForm[field.key]" :placeholder="`请输入${field.label}`" clearable />
        </view>
        <view class="search-actions">
          <wd-button class="flex-1" variant="plain" @click="resetSearch">
            <wd-icon name="close" size="26rpx" color="#475569" custom-class="button-icon" />
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="submitSearch">
            <wd-icon name="search-line" size="26rpx" color="#fff" custom-class="button-icon" />
            搜索
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  getModuleConfig,
  getSourceMultiLabel,
  getStatusLabel,
  getStatusType,
  preloadAllSourceOptions,
} from '@/pages-business/config'
import { businessApi } from '@/api/business'
import { getEnvBaseUrl, navigateBackPlus } from '@/utils'
import type { BusinessModuleConfig } from '@/pages-business/config'

const props = defineProps<{ module?: string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const config = computed<BusinessModuleConfig>(() => getModuleConfig(props.module))
const list = ref<any[]>([])
const pagingRef = ref<any>()
const searchVisible = ref(false)
const quickKeyword = ref('')
const queryParams = ref<Record<string, any>>({})
const searchForm = reactive<Record<string, any>>({})
const timeoutConfigVisible = ref(false)
const timeoutSaving = ref(false)
const sourceLoaded = ref(false)
const timeoutConfig = reactive({
  status: 1,
  timeoutDays: 30,
})

const canEdit = computed(() => !config.value.readonly && !!config.value.update)
const isTimeoutModule = computed(() => config.value.key === 'timeoutReminder')
const isModernModule = computed(() => ['outboundPersonnel', 'bizPackage', 'customerInfo', 'storeList', 'storeInfo'].includes(config.value.key))
const isPackageModule = computed(() => config.value.key === 'bizPackage')
const activeSearchCount = computed(() => Object.values(queryParams.value).filter(value => value !== undefined && value !== '').length)
const quickSearchPlaceholder = computed(() => {
  const labels = config.value.searchFields
    .filter(field => field.type !== 'radio')
    .slice(0, 3)
    .map(field => field.label)
  return labels.length ? `搜索${labels.join(' / ')}` : `搜索${config.value.title}`
})
const searchPlaceholder = computed(() => {
  const conditions = Object.entries(queryParams.value)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${getFieldLabel(key)}:${formatValue(value, key)}`)
  return conditions.length ? conditions.join(' | ') : `搜索${config.value.title}`
})

function handleBack() {
  navigateBackPlus('/pages-business/workbench/index')
}

async function queryList(pageNum: number, pageSize: number) {
  try {
    const res = await config.value.list({
      ...queryParams.value,
      pageNum,
      pageSize,
    })
    pagingRef.value?.completeByTotal(res.rows || [], res.total || 0)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function reload() {
  nextTick(() => {
    pagingRef.value?.reload()
  })
}

function openSearch() {
  for (const field of config.value.searchFields) {
    searchForm[field.key] = queryParams.value[field.key] ?? ''
  }
  searchVisible.value = true
}

function submitSearch() {
  queryParams.value = { ...searchForm }
  quickKeyword.value = searchForm.personName || searchForm.phone || searchForm.userName || ''
  searchVisible.value = false
  reload()
}

function resetSearch() {
  for (const key of Object.keys(searchForm)) {
    searchForm[key] = ''
  }
  quickKeyword.value = ''
  queryParams.value = {}
  searchVisible.value = false
  reload()
}

function submitQuickSearch() {
  if (!isModernModule.value) {
    return
  }
  const keyword = quickKeyword.value.trim()
  const params: Record<string, any> = {}
  if (keyword) {
    params[getQuickSearchKey(keyword)] = keyword
  }
  queryParams.value = params
  for (const field of config.value.searchFields) {
    searchForm[field.key] = params[field.key] ?? ''
  }
  reload()
}

function clearQuickSearch() {
  quickKeyword.value = ''
  resetSearch()
}

function openCreate() {
  uni.navigateTo({ url: `/pages-business/form/index?module=${config.value.key}` })
}

function openForm(item: any) {
  uni.navigateTo({ url: `/pages-business/form/index?module=${config.value.key}&id=${getItemId(item)}` })
}

function openDetail(item: any) {
  const mode = canEdit.value ? '' : '&mode=view'
  uni.navigateTo({ url: `/pages-business/form/index?module=${config.value.key}&id=${getItemId(item) || item.recordId}${mode}` })
}

function tryOpenDetail(item: any) {
  if (canOpenDetail(item)) {
    openDetail(item)
  }
}

function canOpenDetail(item: any) {
  return !!config.value.get && !!getItemId(item) && config.value.formFields.length > 0
}

function getItemId(item: any) {
  const idKey = config.value.idKey || 'id'
  return item?.[idKey] || item?.id
}

async function removeItem(item: any) {
  const { confirm } = await uni.showModal({
    title: '删除确认',
    content: `确定删除这条${config.value.title}数据吗？`,
  })
  if (!confirm) {
    return
  }
  await config.value.remove?.([getItemId(item)])
  toast.success('删除成功')
  reload()
}

async function claimRecord(item: any) {
  const { confirm } = await uni.showModal({
    title: '领取确认',
    content: '确定领取该外呼记录吗？',
  })
  if (!confirm) {
    return
  }
  await config.value.claim?.(getItemId(item))
  toast.success('领取成功')
  reload()
}

function uploadImages(item: any) {
  uni.chooseImage({
    count: 9,
    sizeType: ['compressed'],
    success: async (res) => {
      const filePaths = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [res.tempFilePaths]
      await config.value.uploadImages?.(getItemId(item), filePaths)
      toast.success('上传成功')
      reload()
    },
  })
}

function getFieldLabel(key: string) {
  const labelMap: Record<string, string> = {
    roleName: '角色',
    businessType: '业务类型',
    grid: '网格',
    phone: '联系电话',
    userName: '登录账号',
    personName: '人员姓名',
  }
  if (labelMap[key]) {
    return labelMap[key]
  }
  return [...config.value.searchFields, ...config.value.formFields].find(item => item.key === key)?.label || key
}

function getFieldSource(fieldKey: string) {
  const allFields = [...config.value.searchFields, ...config.value.formFields]
  const target = allFields.find(f => f.key === fieldKey)
  return target?.source
}

function getSecondaryKeys(item: Record<string, any>) {
  if (!isModernModule.value) {
    return config.value.secondaryKeys
  }
  return config.value.secondaryKeys.filter(key => key !== 'userName' || !item.personName)
}

function isWidePersonField(key: string) {
  return false
}

function getFieldIcon(key: string) {
  const iconMap: Record<string, string> = {
    userName: 'user',
    personName: 'user',
    name: 'user',
    customerNumber: 'phone',
    phone: 'phone',
    receiverName: 'user',
    receiver: 'user',
    roleName: 'check-circle',
    businessType: 'list',
    grid: 'location',
    packageName: 'goods',
    packageCode: 'list',
    price: 'money-circle',
    description: 'edit',
    address: 'location',
    storeUserName: 'shop',
    orderTime: 'time',
    followStatus: 'edit',
    sortOrder: 'list',
    gridCode: 'location',
    remark: 'edit',
    overdueDays: 'time',
    assignedPersonName: 'user',
    claimedTime: 'time',
  }
  return iconMap[key] || 'info-circle'
}

function getModuleAvatarIcon() {
  const iconMap: Record<string, string> = {
    outboundPersonnel: 'user',
    customerInfo: 'user',
    bizPackage: 'goods',
    outboundGrid: 'location',
    storeList: 'shop',
    storeInfo: 'shop',
    outboundRecord: 'phone',
    timeoutReminder: 'time',
    assignmentTree: 'list',
  }
  return iconMap[config.value.key] || 'list'
}

function getQuickSearchKey(keyword: string) {
  const availableKeys = config.value.searchFields.map(field => field.key)
  if (/^\d{6,}$/.test(keyword)) {
    const numericKeys = ['phone', 'customerNumber', 'packageCode', 'gridCode', 'userName']
    const matched = numericKeys.find(key => availableKeys.includes(key))
    if (matched) {
      return matched
    }
  }
  const priorityKeys = [
    config.value.primaryKey,
    'personName',
    'name',
    'customerNumber',
    'packageName',
    'gridName',
    'userName',
    'phone',
  ]
  return priorityKeys.find(key => availableKeys.includes(key))
    || config.value.searchFields.find(field => field.type !== 'radio')?.key
    || config.value.searchFields[0]?.key
    || config.value.primaryKey
}

function getValue(item: Record<string, any>, key: string) {
  return formatValue(item[key], key)
}

function formatCurrency(value: any) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  const amount = Number(value)
  if (!Number.isFinite(amount)) {
    return String(value)
  }
  return `￥${amount.toFixed(2)}`
}

// 核心：统一格式化，businessType和grid走完全相同的source翻译逻辑
function formatValue(value: any, fieldKey?: string) {
  if (fieldKey === 'price' || fieldKey === 'packagePrice') {
    return formatCurrency(value)
  }

  const source = fieldKey ? getFieldSource(fieldKey) : undefined
  const rawVal = value

  // 带source配置的字段（businessType/grid/role），统一走接口缓存翻译，和form页面同源
  if (source) {
    return getSourceMultiLabel(source, rawVal)
  }

  // 数组兜底拼接
  if (Array.isArray(rawVal)) {
    const arr = rawVal.filter(v => v !== null && v !== '')
    return arr.length ? arr.join('、') : '-'
  }

  // 空值兜底
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return String(value)
}

async function openTimeoutConfig() {
  timeoutConfigVisible.value = true
  try {
    const data = await businessApi.getTimeoutConfig()
    timeoutConfig.status = data?.status ?? 1
    timeoutConfig.timeoutDays = data?.timeoutDays ?? 30
  } catch {
    timeoutConfig.status = 1
    timeoutConfig.timeoutDays = 30
  }
}

async function saveTimeoutConfig() {
  timeoutSaving.value = true
  try {
    await businessApi.saveTimeoutConfig({
      status: timeoutConfig.status,
      timeoutDays: timeoutConfig.timeoutDays,
    })
    toast.success('设置已保存')
    timeoutConfigVisible.value = false
    reload()
  } finally {
    timeoutSaving.value = false
  }
}

function getImageUrl(url: string) {
  if (!url || url.startsWith('http')) {
    return url
  }
  return `${getEnvBaseUrl() || ''}${url}`
}

function previewImage(urls: string[], current: string) {
  const fullUrls = urls.map(getImageUrl)
  uni.previewImage({ urls: fullUrls, current: getImageUrl(current) })
}

// 数据源加载完成后刷新列表，保证显示中文
watch(sourceLoaded, (val) => {
  if (val)
    reload()
})

onMounted(async () => {
  try {
    // 和form页面加载完全一致的接口数据：业务类型、网格、角色
    await preloadAllSourceOptions()
    sourceLoaded.value = true
    // 数据加载完成再刷新列表，确保渲染时直接显示中文
    reload()
  } catch (err) {
    console.error('初始化数据源失败', err)
    sourceLoaded.value = true
  }
})
</script>

<style scoped lang="scss">
.business-list {
  background: #f3f6fb;
}

.list-tools {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding-right: 24rpx;
  background: #fff;
}

.person-tools {
  gap: 18rpx;
  padding: 20rpx 24rpx;
  background: #eef5ff;
}

.person-search-box {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-width: 0;
  flex: 1;
  height: 80rpx;
  padding: 0 24rpx;
  border: 1rpx solid #e5edf8;
  border-radius: 18rpx;
  background: #fff;
  box-shadow: 0 10rpx 24rpx rgba(15, 46, 92, 0.04);
}

.person-search-input {
  min-width: 0;
  flex: 1;
  height: 80rpx;
  color: #0f172a;
  font-size: 27rpx;
}

:deep(.person-search-placeholder),
.person-search-placeholder {
  color: #9aa9bd;
}

.person-filter-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  width: 124rpx;
  height: 80rpx;
  flex-shrink: 0;
  border: 1rpx solid #e5edf8;
  border-radius: 18rpx;
  color: #0f172a;
  background: #fff;
  box-shadow: 0 10rpx 24rpx rgba(15, 46, 92, 0.04);
  font-size: 28rpx;
  font-weight: 650;
}

.person-filter-count {
  position: absolute;
  right: -8rpx;
  top: -8rpx;
}

.filter-entry {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  border: 1rpx solid #dbe8ff;
  border-radius: 18rpx;
  background: #f8fbff;
}

.filter-title {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #475569;
  font-size: 26rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  color: #fff;
  background: #2f7dff;
  font-size: 22rpx;
}

.record-card {
  position: relative;
  margin-bottom: 20rpx;
  padding: 24rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 10rpx 28rpx rgba(47, 125, 255, 0.07);
}

.person-card {
  padding: 28rpx 24rpx 24rpx;
  border-color: #edf3fb;
  border-radius: 22rpx;
  box-shadow: 0 12rpx 30rpx rgba(15, 46, 92, 0.06);
}

.record-head,
.record-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.record-title {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #0b2b5c;
  font-size: 32rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person-profile {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  gap: 18rpx;
}

.person-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: #eaf2ff;
}

.person-avatar--package {
  border-radius: 8rpx;
  background: #fef2f2;
}

.package-mark {
  position: relative;
  width: 44rpx;
  height: 42rpx;
  color: #dc2626;
}

.package-mark--avatar {
  transform: scale(0.9);
}

.package-mark__box {
  position: absolute;
  left: 4rpx;
  bottom: 0;
  width: 36rpx;
  height: 28rpx;
  border: 4rpx solid currentColor;
  border-radius: 5rpx;
  box-sizing: border-box;
}

.package-mark__lid {
  position: absolute;
  left: 0;
  top: 3rpx;
  width: 44rpx;
  height: 13rpx;
  border: 4rpx solid currentColor;
  border-radius: 5rpx;
  box-sizing: border-box;
}

.package-mark__tape {
  position: absolute;
  left: 19rpx;
  top: 5rpx;
  width: 6rpx;
  height: 35rpx;
  border-radius: 999rpx;
  background: currentColor;
}

.person-title-wrap {
  min-width: 0;
  flex: 1;
}

.person-title-line {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-width: 0;
}

.person-name {
  flex: 1;
  color: #071d3a;
  font-size: 34rpx;
  font-weight: 800;
}

.person-account {
  overflow: hidden;
  margin-top: 6rpx;
  color: #64748b;
  font-size: 23rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-body {
  display: grid;
  gap: 10rpx;
  margin-top: 18rpx;
}

.person-body {
  display: grid;
  gap: 10rpx;
  margin-top: 20rpx;
  padding-left: 94rpx;
}

.record-line {
  display: flex;
  gap: 16rpx;
  color: #4b5563;
  font-size: 26rpx;
  line-height: 1.5;
}

.person-line {
  display: grid;
  grid-template-columns: 34rpx 170rpx minmax(0, 1fr);
  align-items: center;
  gap: 10rpx;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

.person-line--wide {
  grid-column: 1 / -1;
}

.record-label {
  width: 150rpx;
  flex-shrink: 0;
  color: #94a3b8;
}

.person-line .record-label {
  display: block;
  width: auto;
  margin-bottom: 0;
  color: #5f7088;
  font-size: 29rpx;
  line-height: 1.35;
}

.record-text {
  min-width: 0;
  flex: 1;
  word-break: break-word;
}

.person-line .record-text {
  display: block;
  color: #344256;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 1.35;
  word-break: break-word;
}

.record-actions {
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 20rpx;
}

:deep(.person-status-tag) {
  height: 40rpx;
  padding: 0 16rpx;
  border: 0;
  border-radius: 999rpx;
  background: #e8f8ee;
  color: #16a34a;
  font-size: 22rpx;
  font-weight: 700;
}

.person-card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 20rpx;
}

.person-delete-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 56rpx;
  height: 50rpx;
  padding: 0 15rpx;
  border-radius: 8rpx;
  color: #fff;
  background: #409eff;
  font-size: 20rpx;
  font-weight: 500;
  line-height: 1;
}

.image-strip {
  width: 100%;
  margin-top: 18rpx;
  white-space: nowrap;
}

.record-image {
  width: 112rpx;
  height: 112rpx;
  margin-right: 12rpx;
  border-radius: 8rpx;
  background: #f1f5f9;
}

.config-panel {
  padding: 28rpx 28rpx 36rpx;
  background: #fff;
}

.config-title {
  margin-bottom: 24rpx;
  color: #0b2b5c;
  font-size: 32rpx;
  font-weight: 700;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  min-height: 84rpx;
  color: #0b2b5c;
  font-size: 28rpx;
}

.align-start {
  align-items: flex-start;
}

.config-input {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.config-unit {
  color: #64748b;
  font-size: 24rpx;
}

.config-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 28rpx;
}

.search-panel {
  max-height: 78vh;
  overflow-y: auto;
  padding: 28rpx 28rpx 36rpx;
  background: #fff;
}

.person-search-panel {
  max-height: 82vh;
  padding: 30rpx 28rpx 40rpx;
  border-radius: 28rpx 28rpx 0 0;
  background: #f7faff;
}

.search-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.person-search-panel .search-head {
  padding: 4rpx 2rpx 8rpx;
  margin-bottom: 18rpx;
}

.search-title {
  color: #0b2b5c;
  font-size: 32rpx;
  font-weight: 800;
}

.person-search-panel .search-title {
  color: #071d3a;
  font-size: 34rpx;
  font-weight: 850;
}

.search-subtitle {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 23rpx;
}

.person-search-panel .search-subtitle {
  color: #7b8da5;
  font-size: 24rpx;
}

.search-item {
  margin-bottom: 22rpx;
}

.person-search-item {
  margin-bottom: 18rpx;
  padding: 20rpx;
  border: 1rpx solid #e5edf8;
  border-radius: 18rpx;
  background: #fff;
  box-shadow: 0 8rpx 20rpx rgba(15, 46, 92, 0.035);
}

.search-label {
  margin-bottom: 10rpx;
  color: #334155;
  font-size: 25rpx;
  font-weight: 650;
}

.person-search-item .search-label {
  margin-bottom: 12rpx;
  color: #344256;
  font-size: 25rpx;
  font-weight: 750;
}

.person-search-item :deep(.wd-input) {
  min-height: 72rpx;
  padding: 0 18rpx;
  border-radius: 14rpx;
  background: #f5f8fc;
}

.person-search-item :deep(.wd-input__inner) {
  color: #0f172a;
  font-size: 27rpx;
}

.person-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.person-radio-group :deep(.wd-radio) {
  margin-right: 0;
  margin-bottom: 0;
}

.person-radio-group :deep(.wd-radio__label) {
  min-width: 104rpx;
  height: 58rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  font-size: 25rpx;
}

.search-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.person-search-panel .search-actions {
  position: sticky;
  bottom: 0;
  gap: 18rpx;
  margin: 26rpx -2rpx 0;
  padding-top: 18rpx;
  background: #f7faff;
}

.person-search-panel .search-actions :deep(.wd-button) {
  height: 76rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 750;
}

:deep(.button-icon) {
  margin-right: 6rpx;
  vertical-align: -3rpx;
}
</style>
