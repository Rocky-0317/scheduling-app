<template>
  <view class="yd-page-container business-form">
    <wd-navbar :title="pageTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view scroll-y class="min-h-0 flex-1">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <!-- 增加兜底：visibleFields为空不渲染循环，field加可选链?.key -->
          <template v-if="visibleFields.length">
            <template v-for="field in visibleFields" :key="field?.key">
              <view v-if="field.type === 'imageUpload'" class="image-view-wrap">
                <view class="image-label">
                  {{ getDisplayFieldLabel(field) }}
                </view>
                <view class="image-list">
                  <view
                    v-for="imgUrl in imgList(formData[field.key])"
                    :key="imgUrl"
                    class="image-item"
                    @click="previewImage(imgUrl)"
                  >
                    <image :src="getImageFullUrl(imgUrl)" mode="aspectFill" />
                  </view>
                  <view v-if="imgList(formData[field.key]).length === 0" class="image-empty">
                    暂无凭证图片
                  </view>
                </view>
              </view>
              <yd-form-picker
                v-else-if="field.type === 'picker' || field.type === 'multiPicker'"
                v-model="formData[field.key]"
                :label="getDisplayFieldLabel(field)"
                label-width="190rpx"
                :prop="field.key"
                :placeholder="`请选择${getDisplayFieldLabel(field)}`"
                :columns="getPickerOptions(field)"
                :type="field.type === 'multiPicker' ? 'checkbox' : 'radio'"
                :filterable="true"
                :disabled="isView || field.readonly || isFieldReadonlyByRole(field.key)"
                :before-open="() => handlePickerOpen(field)"
                @confirm="value => handlePickerConfirm(field, value)"
              />
              <wd-form-item v-else :title="getDisplayFieldLabel(field)" title-width="190rpx" :prop="field.key">
                <view class="input-wrap">
                  <wd-radio-group
                    v-if="field.type === 'radio'"
                    v-model="formData[field.key]"
                    type="button"
                    :disabled="isView || field.readonly || isFieldReadonlyByRole(field.key)"
                  >
                    <wd-radio v-for="option in getFieldOptions(field)" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </wd-radio>
                  </wd-radio-group>
                  <wd-input-number
                    v-else-if="field.type === 'number'"
                    v-model="formData[field.key]"
                    :min="0"
                    :precision="field.key === 'price' ? 2 : 0"
                    :disabled="isView || field.readonly || isFieldReadonlyByRole(field.key)"
                    clearable="false"
                  />
                  <wd-input
                    v-else-if="field.type === 'date'"
                    :model-value="formatDateText(formData[field.key])"
                    :placeholder="`请选择${getDisplayFieldLabel(field)}`"
                    :disabled="isView || field.readonly || isFieldReadonlyByRole(field.key)"
                    readonly
                    clearable="false"
                    @click="openDatePicker(field.key)"
                  />
                  <wd-textarea
                    v-else-if="field.type === 'textarea'"
                    v-model="formData[field.key]"
                    :placeholder="`请输入${getDisplayFieldLabel(field)}`"
                    :disabled="isView || field.readonly || isFieldReadonlyByRole(field.key)"
                    :maxlength="1000"
                    :auto-height="isView"
                    clearable="false"
                  />
                  <wd-input
                    v-else
                    v-model="formData[field.key]"
                    :placeholder="`请输入${getDisplayFieldLabel(field)}`"
                    :disabled="isView || field.readonly || (field.key === 'userName' && !!props.id) || isFieldReadonlyByRole(field.key)"
                    clearable="false"
                  />
                </view>
              </wd-form-item>
            </template>
          </template>
        </wd-cell-group>
      </wd-form>
    </scroll-view>
    <wd-datetime-picker
      v-model="datePickerValue"
      v-model:visible="datePickerVisible"
      :title="datePickerTitle"
      type="date"
      @confirm="confirmDatePicker"
    />
    <view v-if="!isView && hasEditableField" class="yd-detail-footer">
      <wd-button type="primary" block :loading="submitLoading" @click="submitForm">
        <wd-icon name="check-circle" size="28rpx" color="#fff" custom-class="button-icon" />
        保存
      </wd-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import type { BusinessField } from '@/pages-business/config'
import { businessApi } from '@/api/business'
import { useUserStore } from '@/store/user'
import { getModuleConfig } from '@/pages-business/config'

const props = defineProps<{
  module?: string
  id?: number | string
  mode?: string
}>()
const userStore = useUserStore()
const toast = useToast()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

// 基础ref变量
const formRef = ref<FormInstance>()
const submitLoading = ref(false)
const formData = ref<Record<string, any>>({})
const datePickerVisible = ref(false)
const datePickerValue = ref<number>(Date.now())
const activeDateKey = ref('')
const loadingDetail = ref(false)
const roleOptions = ref<Array<{ label: string, value: number, roleKey: string, disabled: boolean }>>([])
const businessTypeOptions = ref<Array<{ label: string, value: string }>>([])
const businessIsSuccessOptions = ref<Array<{ label: string, value: string }>>([])
const gridOptions = ref<Array<{ label: string, value: string }>>([])

// 全部computed前置定义，增加空数组兜底，防止undefined
const config = computed(() => getModuleConfig(props.module) || { formFields: [], title: '', readonly: false, key: '' })
const isView = computed(() => props.mode === 'view' || config.value.readonly)
const isEdit = computed(() => !!props.id)
const isPersonnelModule = computed(() => config.value.key === 'outboundPersonnel')
const isSalesPerson = computed(() => {
  const roles = userStore.userInfo?.roles || []
  return roles.some(role => role.roleKey === 'salesperson')
})
const salesEditableKeys = ['isSuccess', 'cardNumber', 'imageUrls', 'remark']
const selectedRole = computed(() => roleOptions.value.find(item => String(item.value) === String(formData.value.roleId)))
const needShowGridType = computed(() => {
  if (!isPersonnelModule.value)
    return true
  const roleKey = selectedRole.value?.roleKey
  return ['salesperson', 'business_supervisor', 'offline_store_manager', 'offline_peripheral_stores'].includes(roleKey || '')
})
const showCardNumberField = computed(() => {
  const btVal = formData.value.businessType
  let btList: string[] = []
  if (Array.isArray(btVal)) {
    btList = btVal.filter(Boolean).map(v => String(v))
  } else if (typeof btVal === 'string' && btVal.trim()) {
    btList = btVal.split(',').map(v => v.trim())
  }
  const matchBizType = btList.some(v => ['0', '1'].includes(v))
  const successFlag = String(formData.value.isSuccess ?? '') === '1'
  return matchBizType && successFlag
})

// 核心修复：过滤时增加 field 存在判断，过滤掉undefined字段
const visibleFields = computed(() => {
  const sourceList = config.value.formFields || []
  let fieldList = sourceList.filter((field): field is BusinessField => !!field && !!field.key)

  fieldList = fieldList.filter((field) => {
    if (!isEdit.value && field.hiddenOnCreate)
      return false
    if (isPersonnelModule.value && ['businessType', 'grid'].includes(field.key)) {
      return needShowGridType.value
    }
    return true
  })

  if (!showCardNumberField.value) {
    fieldList = fieldList.filter(item => item.key !== 'cardNumber')
  }
  return fieldList
})

const needRequireBusinessType = computed(() => ['salesperson', 'offline_peripheral_stores'].includes(selectedRole.value?.roleKey ?? ''))
const needRequireGrid = computed(() => ['salesperson', 'offline_peripheral_stores'].includes(selectedRole.value?.roleKey ?? ''))
const filteredBusinessTypeOptions = computed(() => {
  const roleKey = selectedRole.value?.roleKey
  if (!isPersonnelModule.value || !roleKey || ['offline_store_manager', 'offline_peripheral_stores'].includes(roleKey)) {
    return businessTypeOptions.value
  }
  return businessTypeOptions.value.filter(item => !['2', '3', '4'].includes(String(item.value)))
})
const pageTitle = computed(() => {
  if (isView.value)
    return `${config.value.title}详情`
  return isEdit.value ? `编辑${config.value.title}` : `新增${config.value.title}`
})
const hasEditableField = computed(() => {
  if (!isSalesPerson.value)
    return true
  return visibleFields.value.some(field => salesEditableKeys.includes(field.key))
})
const datePickerTitle = computed(() => {
  const field = visibleFields.value.find(item => item.key === activeDateKey.value)
  return `请选择${field ? getDisplayFieldLabel(field) : '日期'}`
})
const formSchema = computed(() => createFormSchema(
  visibleFields.value.reduce((rules, field) => {
    let requiredFlag = field.required && !field.readonly && !isView.value
    if (isSalesPerson.value && !salesEditableKeys.includes(field.key))
      requiredFlag = false
    if (isView.value)
      requiredFlag = false
    if (field.key === 'cardNumber')
      requiredFlag = showCardNumberField.value && !isView.value
    if (requiredFlag)
      rules[field.key] = [{ required: true, message: `${getDisplayFieldLabel(field)}不能为空` }]
    return rules
  }, {} as Record<string, any>),
))

// 工具函数
function isFieldReadonlyByRole(fieldKey: string): boolean {
  if (!isSalesPerson.value)
    return false
  return !salesEditableKeys.includes(fieldKey)
}
function hasPerm(perms: string[]): boolean {
  const userPermissions = userStore.permissions || []
  if (userPermissions.includes('*:*:*'))
    return true
  return perms.some(p => userPermissions.includes(p))
}
function initDefaults() {
  const data: Record<string, any> = {}
  const sourceFields = config.value.formFields || []
  for (const field of sourceFields) {
    if (!field?.key)
      continue
    if (field.type === 'radio')
      data[field.key] = field.options?.[0]?.value ?? ''
    else if (field.type === 'multiPicker' || field.type === 'imageUpload')
      data[field.key] = []
    else if (field.type === 'picker')
      data[field.key] = undefined
    else if (field.type === 'number')
      data[field.key] = 0
    else if (field.type === 'date')
      data[field.key] = ''
    else data[field.key] = ''
  }
  if (!isEdit.value)
    data.registerDate = getTodayStr()
  formData.value = data
}
function getTodayStr() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
async function loadDetail() {
  if (!props.id || !config.value.get)
    return
  loadingDetail.value = true
  uni.showLoading({ title: '加载中' })
  try {
    const detail = await config.value.get(Number(props.id))
    initDefaults()
    const nextData = { ...formData.value, ...(detail || {}) }
    if (isPersonnelModule.value) {
      nextData.roleId = resolveRoleIdFromRoleName(nextData.roleId, detail?.roleName)
      nextData.businessType = normalizeMultiValue(detail?.businessType)
      nextData.grid = normalizeMultiValue(detail?.grid)
    }
    nextData.imageUrls = normalizeMultiValue(detail?.imageUrls)
    formData.value = nextData
    await nextTick()
  } finally {
    loadingDetail.value = false
    uni.hideLoading()
  }
}
async function submitForm() {
  const result = await formRef.value?.validate()
  if (result && !result.valid)
    return
  if (!validatePersonnelForm())
    return
  submitLoading.value = true
  try {
    Object.keys(formData.value).forEach((key) => {
      const field = visibleFields.value.find(f => f.key === key)
      if (field?.type === 'imageUpload' && Array.isArray(formData.value[key])) {
        formData.value[key] = formData.value[key].join(',')
      }
    })
    if (isEdit.value) {
      await config.value.update?.({ ...formData.value, id: Number(props.id) })
      toast.success('修改成功')
    } else {
      await config.value.create?.(formData.value)
      toast.success('新增成功')
    }
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}
function validatePersonnelForm() {
  if (!isPersonnelModule.value || isView.value)
    return true
  const userName = String(formData.value.userName || '')
  if (userName.length < 2 || userName.length > 20) {
    toast.warning('账号长度需为2~20位')
    return false
  }
  if (String(formData.value.phone || '').length > 11) {
    toast.warning('手机号长度不能超过11位')
    return false
  }
  if (needRequireBusinessType.value && normalizeMultiValue(formData.value.businessType).length === 0) {
    toast.warning('请选择业务类型')
    return false
  }
  if (needRequireGrid.value && normalizeMultiValue(formData.value.grid).length === 0) {
    toast.warning('请选择网格')
    return false
  }
  return true
}
function openDatePicker(key: string) {
  if (isView.value || isFieldReadonlyByRole(key))
    return
  activeDateKey.value = key
  const currentValue = formData.value[key]
  datePickerValue.value = currentValue ? new Date(currentValue).getTime() : Date.now()
  datePickerVisible.value = true
}
function confirmDatePicker({ value }: { value: number }) {
  if (!activeDateKey.value)
    return
  formData.value[activeDateKey.value] = formatDateValue(value)
}
function formatDateValue(value: number | string | Date) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
function formatDateText(value: unknown) {
  if (!value)
    return ''
  return formatDateValue(value as string)
}
function normalizeMultiValue(value?: string | string[]) {
  if (Array.isArray(value))
    return value.filter(Boolean)
  if (value === undefined || value === null || value === '')
    return []
  return String(value).split(',').map(item => item.trim()).filter(Boolean)
}
function isTerminalBusinessType() {
  const typeList = normalizeMultiValue(formData.value.businessType).map(item => String(item))
  return typeList.some((value) => {
    if (value === '1')
      return true
    const option = businessTypeOptions.value.find(item => String(item.value) === value)
    return option?.label?.includes('终端')
  })
}
function getDisplayFieldLabel(field: BusinessField) {
  if (config.value.key === 'outboundRecord' && field.key === 'cardNumber' && isTerminalBusinessType())
    return '终端串码'
  return field.label
}
function imgList(rawVal: string | string[] | undefined) {
  return normalizeMultiValue(rawVal)
}
function getImageFullUrl(url: string): string {
  if (!url)
    return ''
  if (url.startsWith('http'))
    return url
  const baseApi = import.meta.env.VITE_APP_BASE_API || ''
  return `${baseApi}${url}`
}
function previewImage(url: string) {
  const imageUrl = getImageFullUrl(url)
  uni.previewImage({ urls: [imageUrl], current: imageUrl })
}
function getPickerOptions(field: BusinessField) {
  return getFieldOptions(field)
}
function getFieldOptions(field: BusinessField) {
  if (field.source === 'role')
    return roleOptions.value
  if (field.source === 'businessType')
    return filteredBusinessTypeOptions.value
  if (field.source === 'businessIsSuccess')
    return businessIsSuccessOptions.value
  if (field.source === 'grid')
    return gridOptions.value
  return field.options || []
}
function handlePickerOpen(field: BusinessField) {
  if (field.source === 'grid')
    void loadGridOptions(true)
}
function handlePickerConfirm(field: BusinessField, value: any) {
  formData.value[field.key] = value
  if ((field.key === 'businessType' || field.key === 'isSuccess') && !loadingDetail.value) {
    formData.value.cardNumber = ''
  }
  if (field.key === 'roleId') {
    formData.value.roleName = roleOptions.value.find(item => String(item.value) === String(value))?.label || ''
    formData.value.businessType = []
    formData.value.grid = []
    if (needShowGridType.value)
      void loadGridOptions(true)
  }
}
function resolveRoleIdFromRoleName(roleId: any, roleName?: string) {
  if (roleId !== undefined && roleId !== null && roleId !== '')
    return roleId
  const matchedRole = roleOptions.value.find(item => item.label === roleName)
  return matchedRole?.value ?? roleId
}
async function loadRoleOptions() {
  if (!isPersonnelModule.value)
    return
  const res = await businessApi.listRoleOptions()
  roleOptions.value = (res.rows || [])
    .filter(role => role.roleKey !== 'admin')
    .map(role => ({
      label: role.roleName,
      value: role.roleId,
      roleKey: role.roleKey,
      disabled: role.status === '1',
    }))
}
async function loadBusinessTypeOptions() {
  const rows = await businessApi.listBusinessTypeOptions()
  businessTypeOptions.value = (rows || [])
    .filter(item => item.status === undefined || String(item.status) === '0')
    .map(item => ({
      label: item.dictLabel || item.label || '',
      value: String(item.dictValue ?? item.value ?? ''),
    }))
    .filter(item => item.label && item.value !== '')
}
async function loadBusinessIsSuccessOptions() {
  const rows = await businessApi.listBusinessIsSuccessOptions()
  businessIsSuccessOptions.value = (rows || [])
    .filter(item => item.status === undefined || String(item.status) === '0')
    .map(item => ({
      label: item.dictLabel || item.label || '',
      value: String(item.dictValue ?? item.value ?? ''),
    }))
    .filter(item => item.label && item.value !== '')
}
async function loadGridOptions(force = false) {
  if (!force && gridOptions.value.length > 0)
    return
  const res = await businessApi.listActiveGridOptions()
  gridOptions.value = (res.rows || []).map(item => ({
    label: item.gridName || '',
    value: item.gridName || '',
  })).filter(item => item.value)
}
function handleBack() {
  navigateBackPlus(`/pages-business/manager/index?module=${config.value.key}`)
}

watch([() => formData.value.businessType, () => formData.value.isSuccess], () => {
  if (!loadingDetail.value)
    formData.value.cardNumber = ''
}, { deep: true })
watch(() => formData.value.roleId, (next, prev) => {
  if (!isPersonnelModule.value || next === prev || !prev)
    return
  formData.value.businessType = []
  formData.value.grid = []
})

onMounted(async () => {
  await loadRoleOptions()
  await loadBusinessTypeOptions()
  await loadBusinessIsSuccessOptions()
  await loadGridOptions()
  initDefaults()
  if (isEdit.value)
    await loadDetail()
  if (isPersonnelModule.value && needShowGridType.value)
    await loadGridOptions(true)
})
</script>

<style scoped lang="scss">
.business-form {
  background: #f5f7fb;
}
:deep(.wd-cell-group) {
  margin: 20rpx 24rpx;
  overflow: hidden;
  border-radius: 8rpx;
}
:deep(.wd-cell) {
  align-items: flex-start;
}
:deep(.wd-cell__title) {
  flex: 0 0 190rpx;
}
:deep(.wd-cell__value) {
  min-width: 0;
}
:deep(.wd-textarea) {
  min-height: 48rpx;
}
:deep(.wd-textarea__inner) {
  min-height: 48rpx;
  line-height: 1.5;
}
:deep(.button-icon) {
  margin-right: 12rpx;
  vertical-align: -3rpx;
}
.yd-detail-footer {
  padding: 24rpx;
  background: #fff;
}
.image-view-wrap {
  padding: 24rpx;
}
.image-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
}
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.image-item {
  width: 200rpx;
  height: 200rpx;
  border-radius: 8rpx;
  overflow: hidden;
  background: #eee;
  position: relative;
}
.image-item image {
  width: 100%;
  height: 100%;
}
.image-empty {
  font-size: 26rpx;
  color: #999;
  padding: 40rpx 0;
}
:deep(.wd-input__clear),
:deep(.wd-textarea__clear),
:deep(.wd-input-number__clear) {
  display: none !important;
  visibility: hidden !important;
  width: 0 !important;
  height: 0 !important;
}
</style>
