<template>
  <view class="yd-page-container business-form">
    <wd-navbar :title="pageTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <template v-for="field in visibleFields" :key="field.key">
            <yd-form-picker
              v-if="field.type === 'picker' || field.type === 'multiPicker'"
              v-model="formData[field.key]"
              :label="field.label"
              label-width="190rpx"
              :prop="field.key"
              :placeholder="`请选择${field.label}`"
              :columns="getPickerOptions(field)"
              :type="field.type === 'multiPicker' ? 'checkbox' : 'radio'"
              :filterable="true"
              :clearable="true"
              :disabled="isView || field.readonly"
              :before-open="() => handlePickerOpen(field)"
              @confirm="value => handlePickerConfirm(field, value)"
              @clear="() => handlePickerConfirm(field, field.type === 'multiPicker' ? [] : undefined)"
            />
            <wd-form-item v-else :title="field.label" title-width="190rpx" :prop="field.key">
              <wd-radio-group v-if="field.type === 'radio'" v-model="formData[field.key]" type="button" :disabled="isView || field.readonly">
                <wd-radio v-for="option in field.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </wd-radio>
              </wd-radio-group>
              <wd-input-number
                v-else-if="field.type === 'number'"
                v-model="formData[field.key]"
                :min="0"
                :precision="field.key === 'price' ? 2 : 0"
                :disabled="isView || field.readonly"
              />
              <wd-input
                v-else-if="field.type === 'date'"
                :model-value="formatDateText(formData[field.key])"
                :placeholder="`请选择${field.label}`"
                :disabled="isView || field.readonly"
                readonly
                clearable
                @click="openDatePicker(field.key)"
                @clear="formData[field.key] = ''"
              />
              <wd-textarea
                v-else-if="field.type === 'textarea'"
                v-model="formData[field.key]"
                :placeholder="`请输入${field.label}`"
                :disabled="isView || field.readonly"
                :maxlength="1000"
                clearable
              />
              <wd-input
                v-else
                v-model="formData[field.key]"
                :placeholder="`请输入${field.label}`"
                :disabled="isView || field.readonly || (field.key === 'userName' && !!props.id)"
                clearable
              />
            </wd-form-item>
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

    <!-- 编辑/新增：保存按钮 -->
    <view v-if="!isView" class="yd-detail-footer">
      <wd-button type="primary" block :loading="submitLoading" @click="submitForm">
        <wd-icon name="check-circle" size="28rpx" color="#fff" custom-class="button-icon" />
        保存
      </wd-button>
    </view>

    <!-- 门店详情：查看二维码按钮 -->
    <view v-if="isView && isStoreModule" class="yd-detail-footer">
      <wd-button type="primary" block @click="openQrDialog">
        <wd-icon name="picture" size="28rpx" color="#fff" custom-class="button-icon" />
        查看门店二维码
      </wd-button>
    </view>

    <!-- 门店二维码弹窗 -->
    <wd-popup v-model="qrDialogVisible" position="center" custom-style="border-radius: 24rpx; width: 600rpx;">
      <view class="qr-dialog">
        <view class="qr-title">
          门店推广二维码
        </view>
        <view class="qr-box">
          <view v-if="qrModules.length" class="qr-grid">
            <view
              v-for="(isDark, index) in qrModules"
              :key="index"
              class="qr-cell"
              :class="{ 'qr-cell--dark': isDark }"
              :style="{ width: qrCellSize, height: qrCellSize }"
            />
          </view>
          <view v-else class="qr-loading">
            二维码生成中...
          </view>
        </view>
        <view class="qr-tip">
          手机扫码进入门店套餐页面
        </view>

        <!-- 链接展示区 -->
        <!--        <view class="qr-link-box"> -->
        <!--          <view class="qr-link-label">推广链接</view> -->
        <!--          <view class="qr-link-text">{{ shopH5Url }}</view> -->
        <!--          <wd-button size="small" type="primary" plain block @click="copyLink"> -->
        <!--            <wd-icon name="copy" size="24rpx" color="#2f7dff" custom-class="button-icon" /> -->
        <!--            复制链接 -->
        <!--          </wd-button> -->
        <!--        </view> -->

        <view class="qr-footer">
          <wd-button block @click="qrDialogVisible = false">
            关闭
          </wd-button>
        </view>
      </view>
    </wd-popup>
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
import { getModuleConfig } from '@/pages-business/config'
import '@/utils/text-encoder-polyfill'
import QRCode from 'qrcode'

const props = defineProps<{
  module?: string
  id?: number | string
  mode?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<FormInstance>()
const submitLoading = ref(false)
const formData = ref<Record<string, any>>({})
const datePickerVisible = ref(false)
const datePickerValue = ref<number>(Date.now())
const activeDateKey = ref('')
const roleOptions = ref<any[]>([])
const businessTypeOptions = ref<Array<{ label: string, value: string }>>([])
const gridOptions = ref<Array<{ label: string, value: string }>>([])
const qrDialogVisible = ref(false)
const qrModules = ref<boolean[]>([])
const qrSize = ref(0)

const config = computed(() => getModuleConfig(props.module))
const isView = computed(() => props.mode === 'view' || config.value.readonly)
const isEdit = computed(() => !!props.id)
const isPersonnelModule = computed(() => config.value.key === 'outboundPersonnel')
// 判断是否为门店相关模块（门店列表、门店信息）
const isStoreModule = computed(() => ['storeList', 'storeInfo'].includes(config.value.key))

// 门店H5推广链接：和web端规则完全一致 域名/h5/package-shop.html?shopId=门店ID
const shopH5Url = computed(() => {
  const shopId = formData.value.id || props.id
  // 固定使用80端口的web服务地址
  const h5Base = import.meta.env.VITE_H5_WEB_BASE
  return `${h5Base}/h5/package-shop.html?shopId=${shopId}`
})
const qrCellSize = computed(() => qrSize.value ? `${460 / qrSize.value}rpx` : '0rpx')

const selectedRole = computed(() => roleOptions.value.find(item => String(item.value) === String(formData.value.roleId)))
const needShowGridType = computed(() => {
  if (!isPersonnelModule.value) {
    return true
  }
  const roleKey = selectedRole.value?.roleKey
  return ['salesperson', 'business_supervisor', 'offline_store_manager', 'offline_peripheral_stores'].includes(roleKey)
})
const needRequireBusinessType = computed(() => ['salesperson', 'offline_peripheral_stores'].includes(selectedRole.value?.roleKey))
const needRequireGrid = computed(() => ['salesperson', 'offline_peripheral_stores'].includes(selectedRole.value?.roleKey))
const filteredBusinessTypeOptions = computed(() => {
  const roleKey = selectedRole.value?.roleKey
  if (!isPersonnelModule.value || !roleKey || ['offline_store_manager', 'offline_peripheral_stores'].includes(roleKey)) {
    return businessTypeOptions.value
  }
  return businessTypeOptions.value.filter(item => !['2', '3', '4'].includes(String(item.value)))
})
const pageTitle = computed(() => {
  if (isView.value) {
    return `${config.value.title}详情`
  }
  return isEdit.value ? `编辑${config.value.title}` : `新增${config.value.title}`
})
const visibleFields = computed(() => config.value.formFields.filter((field) => {
  if (!isEdit.value && field.hiddenOnCreate) {
    return false
  }
  if (isPersonnelModule.value && ['businessType', 'grid'].includes(field.key)) {
    return needShowGridType.value
  }
  return true
}))
const datePickerTitle = computed(() => {
  const field = visibleFields.value.find(item => item.key === activeDateKey.value)
  return `请选择${field?.label || '日期'}`
})
const formSchema = computed(() => createFormSchema(
  visibleFields.value.reduce((rules, field) => {
    if (field.required && !field.readonly && !isView.value) {
      rules[field.key] = [{ required: true, message: `${field.label}不能为空` }]
    }
    return rules
  }, {} as Record<string, any>),
))

function initDefaults() {
  const data: Record<string, any> = {}
  for (const field of config.value.formFields) {
    if (field.type === 'radio') {
      data[field.key] = field.options?.[0]?.value ?? ''
    } else if (field.type === 'multiPicker') {
      data[field.key] = []
    } else if (field.type === 'picker') {
      data[field.key] = undefined
    } else if (field.type === 'number') {
      data[field.key] = 0
    } else if (field.type === 'date') {
      data[field.key] = ''
    } else {
      data[field.key] = ''
    }
  }
  formData.value = data
}

async function loadDetail() {
  initDefaults()
  if (!props.id || !config.value.get) {
    return
  }
  uni.showLoading({ title: '加载中' })
  try {
    const detail = await config.value.get(Number(props.id))
    const nextData = { ...formData.value, ...(detail || {}) }
    if (isPersonnelModule.value) {
      nextData.roleId = resolveRoleIdFromRoleName(nextData.roleId, detail?.roleName)
      nextData.businessType = normalizeMultiValue(detail?.businessType)
      nextData.grid = normalizeMultiValue(detail?.grid)
    }
    formData.value = nextData
  } finally {
    uni.hideLoading()
  }
}

async function submitForm() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!validatePersonnelForm()) {
    return
  }
  submitLoading.value = true
  try {
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
  if (!isPersonnelModule.value || isView.value) {
    return true
  }
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
  if (isView.value) {
    return
  }
  activeDateKey.value = key
  const currentValue = formData.value[key]
  datePickerValue.value = currentValue ? new Date(currentValue).getTime() : Date.now()
  datePickerVisible.value = true
}

function confirmDatePicker({ value }: { value: number }) {
  if (!activeDateKey.value) {
    return
  }
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
  if (!value) {
    return ''
  }
  return formatDateValue(value as string)
}

function normalizeMultiValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value
  }
  if (value === undefined || value === null || value === '') {
    return []
  }
  return String(value).split(',').map(item => item.trim()).filter(Boolean)
}

function getPickerOptions(field: BusinessField) {
  if (field.source === 'role') {
    return roleOptions.value
  }
  if (field.source === 'businessType') {
    return filteredBusinessTypeOptions.value
  }
  if (field.source === 'grid') {
    return gridOptions.value
  }
  return field.options || []
}

function handlePickerOpen(field: BusinessField) {
  if (field.source === 'grid') {
    void loadGridOptions(true)
  }
}

function handlePickerConfirm(field: BusinessField, value: any) {
  formData.value[field.key] = value
  if (field.key === 'roleId') {
    formData.value.roleName = roleOptions.value.find(item => String(item.value) === String(value))?.label || ''
    formData.value.businessType = []
    formData.value.grid = []
    if (needShowGridType.value) {
      void loadGridOptions(true)
    }
  }
}

function resolveRoleIdFromRoleName(roleId: any, roleName?: string) {
  if (roleId !== undefined && roleId !== null && roleId !== '') {
    return roleId
  }
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

async function loadGridOptions(force = false) {
  if (!force && gridOptions.value.length > 0)
    return
  const res = await businessApi.listActiveGridOptions()
  gridOptions.value = (res.rows || []).map(item => ({
    label: item.gridName || '',
    value: item.gridName || '',
  })).filter(item => item.value)
}

// 生成二维码
async function generateQrCode() {
  try {
    qrModules.value = []
    qrSize.value = 0
    const url = shopH5Url.value
    // 直接渲染二维码矩阵，兼容缺少 DOM canvas 的 App 真机环境。
    const margin = 2
    const qr = QRCode.create(url, {
      errorCorrectionLevel: 'M',
    })
    const size = qr.modules.size
    const outputSize = size + margin * 2
    const modules: boolean[] = []

    for (let row = 0; row < outputSize; row++) {
      for (let col = 0; col < outputSize; col++) {
        const sourceRow = row - margin
        const sourceCol = col - margin
        modules.push(
          sourceRow >= 0
          && sourceRow < size
          && sourceCol >= 0
          && sourceCol < size
          && !!qr.modules.get(sourceRow, sourceCol),
        )
      }
    }

    qrSize.value = outputSize
    qrModules.value = modules
  } catch (err) {
    console.error('二维码生成失败', err)
    toast.error('二维码生成失败')
  }
}

// 打开二维码弹窗
function openQrDialog() {
  if (!formData.value.id && !props.id) {
    toast.error('未获取到门店ID')
    return
  }
  qrDialogVisible.value = true
  // 弹窗打开后生成二维码，确保DOM就绪
  nextTick(() => {
    generateQrCode()
  })
}

// 复制链接
function copyLink() {
  uni.setClipboardData({
    data: shopH5Url.value,
    success: () => {
      toast.success('链接已复制')
    },
  })
}

function handleBack() {
  navigateBackPlus(`/pages-business/manager/index?module=${config.value.key}`)
}

watch(() => formData.value.roleId, (next, prev) => {
  if (!isPersonnelModule.value || next === prev || !prev) {
    return
  }
  formData.value.businessType = []
  formData.value.grid = []
})

onMounted(async () => {
  await loadRoleOptions()
  await loadBusinessTypeOptions()
  await loadGridOptions()
  await loadDetail()
  if (isPersonnelModule.value && needShowGridType.value) {
    await loadGridOptions(true)
  }
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

:deep(.button-icon) {
  margin-right: 12rpx;
  vertical-align: -3rpx;
}

.qr-dialog {
  padding: 40rpx 32rpx 32rpx;
  background: #fff;
}

.qr-title {
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #0b2b5c;
  margin-bottom: 32rpx;
}

.qr-box {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30rpx 0;
  background: #f8fafc;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  min-height: 460rpx;
}

.qr-grid {
  display: flex;
  flex-wrap: wrap;
  width: 460rpx;
  height: 460rpx;
  overflow: hidden;
  background: #fff;
}

.qr-cell {
  flex: none;
  background: #fff;
}

.qr-cell--dark {
  background: #111827;
}

.qr-loading {
  font-size: 26rpx;
  color: #94a3b8;
}

.qr-tip {
  text-align: center;
  font-size: 26rpx;
  color: #64748b;
  margin-bottom: 24rpx;
}

/* 新增：链接区域样式 */
.qr-link-box {
  padding: 20rpx;
  background: #f5f8ff;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}

.qr-link-label {
  font-size: 24rpx;
  color: #475569;
  margin-bottom: 10rpx;
  font-weight: 600;
}

.qr-link-text {
  font-size: 24rpx;
  color: #2f7dff;
  word-break: break-all;
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.qr-footer {
  margin-top: 16rpx;
}
</style>
