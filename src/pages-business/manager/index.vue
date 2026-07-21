<template>
  <view class="yd-page-container yd-page-container-paging business-list">
    <wd-navbar :title="config.title" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <view class="list-tools">
      <view class="filter-entry" @click="openSearch">
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
        <view v-for="item in list" :key="getItemId(item) || item.recordId || item.customerNumber" class="record-card">
          <view class="record-head" @click="tryOpenDetail(item)">
            <view class="record-title">
              {{ getValue(item, config.primaryKey) || '-' }}
            </view>
            <wd-tag v-if="config.badgeKey" :type="getStatusType(config.badgeKey, item[config.badgeKey], config.badgeOptions)" plain>
              {{ getStatusLabel(config.badgeKey, item[config.badgeKey], config.badgeOptions) }}
            </wd-tag>
          </view>

          <view class="record-body" @click="tryOpenDetail(item)">
            <view v-for="key in config.secondaryKeys" :key="key" class="record-line">
              <text class="record-label">{{ getFieldLabel(key) }}</text>
              <text class="record-text">{{ formatValue(item[key]) }}</text>
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

          <view class="record-actions">
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
      <view class="search-panel">
        <view class="search-head">
          <view>
            <view class="search-title">
              筛选{{ config.title }}
            </view>
            <view class="search-subtitle">
              填写条件后按列表查询
            </view>
          </view>
          <wd-icon name="close" size="34rpx" color="#64748b" @click="searchVisible = false" />
        </view>
        <view v-for="field in config.searchFields" :key="field.key" class="search-item">
          <view class="search-label">
            {{ field.label }}
          </view>
          <wd-radio-group v-if="field.type === 'radio'" v-model="searchForm[field.key]" type="button">
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
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, reactive, ref } from 'vue'
import { getModuleConfig, getStatusLabel, getStatusType } from '@/pages-business/config'
import { businessApi } from '@/api/business'
import { getEnvBaseUrl, navigateBackPlus } from '@/utils'

const props = defineProps<{ module?: string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const config = computed(() => getModuleConfig(props.module))
const list = ref<any[]>([])
const pagingRef = ref<any>()
const searchVisible = ref(false)
const queryParams = ref<Record<string, any>>({})
const searchForm = reactive<Record<string, any>>({})
const timeoutConfigVisible = ref(false)
const timeoutSaving = ref(false)
const timeoutConfig = reactive({
  status: 1,
  timeoutDays: 30,
})

const canEdit = computed(() => !config.value.readonly && !!config.value.update)
const isTimeoutModule = computed(() => config.value.key === 'timeoutReminder')
const activeSearchCount = computed(() => Object.values(queryParams.value).filter(value => value !== undefined && value !== '').length)
const searchPlaceholder = computed(() => {
  const conditions = Object.entries(queryParams.value)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${getFieldLabel(key)}:${formatValue(value)}`)
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
  pagingRef.value?.reload()
}

function openSearch() {
  for (const field of config.value.searchFields) {
    searchForm[field.key] = queryParams.value[field.key] ?? ''
  }
  searchVisible.value = true
}

function submitSearch() {
  queryParams.value = { ...searchForm }
  searchVisible.value = false
  reload()
}

function resetSearch() {
  for (const key of Object.keys(searchForm)) {
    searchForm[key] = ''
  }
  queryParams.value = {}
  searchVisible.value = false
  reload()
}

function openCreate() {
  uni.navigateTo({ url: `/pages-business/form/index?module=${config.value.key}` })
}

function openForm(item: any) {
  uni.navigateTo({ url: `/pages-business/form/index?module=${config.value.key}&id=${getItemId(item)}` })
}

function openDetail(item: any) {
  uni.navigateTo({ url: `/pages-business/form/index?module=${config.value.key}&id=${getItemId(item) || item.recordId}&mode=view` })
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
  return [...config.value.searchFields, ...config.value.formFields].find(item => item.key === key)?.label || key
}

function getValue(item: Record<string, any>, key: string) {
  return formatValue(item[key])
}

function formatValue(value: any) {
  if (Array.isArray(value)) {
    return value.length ? value.join('、') : '-'
  }
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
  margin-bottom: 20rpx;
  padding: 24rpx;
  border: 1rpx solid #eef2f7;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 10rpx 28rpx rgba(47, 125, 255, 0.07);
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

.record-body {
  display: grid;
  gap: 10rpx;
  margin-top: 18rpx;
}

.record-line {
  display: flex;
  gap: 16rpx;
  color: #4b5563;
  font-size: 26rpx;
  line-height: 1.5;
}

.record-label {
  width: 150rpx;
  flex-shrink: 0;
  color: #94a3b8;
}

.record-text {
  min-width: 0;
  flex: 1;
  word-break: break-word;
}

.record-actions {
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 20rpx;
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

.search-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.search-title {
  color: #0b2b5c;
  font-size: 32rpx;
  font-weight: 800;
}

.search-subtitle {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 23rpx;
}

.search-item {
  margin-bottom: 22rpx;
}

.search-label {
  margin-bottom: 10rpx;
  color: #334155;
  font-size: 25rpx;
  font-weight: 650;
}

.search-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

:deep(.button-icon) {
  margin-right: 6rpx;
  vertical-align: -3rpx;
}
</style>
