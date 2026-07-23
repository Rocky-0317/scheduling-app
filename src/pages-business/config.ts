// ========== 所有import统一放在文件顶层，消除位置错误、重复导入红线 ==========
import { businessApi } from '@/api/business'

export type BusinessModuleKey
  = | 'outboundRecord'
    | 'outboundPersonnel'
    | 'outboundGrid'
    | 'bizPackage'
    | 'customerInfo'
    | 'storeList'
    | 'storeInfo'
    | 'timeoutReminder'
    | 'assignmentTree'

export interface BusinessField {
  key: string
  label: string
  type?: 'text' | 'number' | 'textarea' | 'radio' | 'date' | 'picker' | 'multiPicker'
  required?: boolean
  readonly?: boolean
  hiddenOnCreate?: boolean
  options?: Array<{ label: string, value: string | number }>
  source?: 'role' | 'businessType' | 'grid'
}

export interface BusinessModuleConfig {
  key: BusinessModuleKey
  title: string
  list: (params: Record<string, any>) => Promise<any>
  get?: (id: number) => Promise<any>
  create?: (data: Record<string, any>) => Promise<any>
  update?: (data: Record<string, any>) => Promise<any>
  remove?: (ids: number[]) => Promise<any>
  claim?: (id: number) => Promise<any>
  uploadImages?: (id: number, filePaths: string[]) => Promise<any>
  idKey?: string
  primaryKey: string
  secondaryKeys: string[]
  badgeKey?: string
  badgeOptions?: Array<{ label: string, value: string | number }>
  searchFields: BusinessField[]
  formFields: BusinessField[]
  readonly?: boolean
  canCreate?: boolean
}

export const statusOptions = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' },
]

export const enableOptions = [
  { label: '启用', value: '1' },
  { label: '停用', value: '0' },
]

export const assignmentOptions = [
  { label: '未分发', value: '0' },
  { label: '待领取', value: '1' },
  { label: '已领取', value: '2' },
]

export const claimOptions = [
  { label: '未领取', value: '0' },
  { label: '已领取', value: '1' },
]

export const successOptions = [
  { label: '未处理', value: '0' },
  { label: '成功', value: '1' },
  { label: '失败', value: '2' },
]

export const businessModules: Record<BusinessModuleKey, BusinessModuleConfig> = {
  outboundRecord: {
    key: 'outboundRecord',
    title: '外呼记录',
    list: businessApi.listOutboundRecord,
    get: businessApi.getOutboundRecord,
    create: businessApi.createOutboundRecord,
    update: businessApi.updateOutboundRecord,
    remove: businessApi.deleteOutboundRecord,
    claim: businessApi.claimOutboundRecord,
    uploadImages: businessApi.uploadOutboundRecordImages,
    primaryKey: 'customerNumber',
    secondaryKeys: ['packageName', 'grid', 'receiverName', 'orderTime', 'followStatus'],
    badgeKey: 'assignmentStatus',
    badgeOptions: assignmentOptions,
    canCreate: true,
    searchFields: [
      { key: 'customerNumber', label: '客户号码' },
      { key: 'packageName', label: '套餐' },
      { key: 'grid', label: '网格', type: 'picker', source: 'grid' },
      { key: 'receiver', label: '接单人' },
      { key: 'assignmentStatus', label: '分发状态', type: 'radio', options: assignmentOptions },
      { key: 'isSuccess', label: '办理结果', type: 'radio', options: successOptions },
    ],
    formFields: [
      { key: 'businessType', label: '业务类型', type: 'picker', source: 'businessType', required: true },
      { key: 'registerDate', label: '登记日期', type: 'date' },
      { key: 'registrant', label: '登记人', required: true },
      { key: 'customerNumber', label: '客户号码', required: true },
      { key: 'packageName', label: '套餐' },
      { key: 'grid', label: '网格', type: 'picker', source: 'grid', required: true },
      { key: 'deliveryAddress', label: '配送地址', type: 'textarea' },
      { key: 'receiver', label: '接单人', hiddenOnCreate: true, readonly: true },
      { key: 'receiverName', label: '接单人', hiddenOnCreate: true, readonly: true },
      { key: 'orderTime', label: '接单时间', hiddenOnCreate: true, readonly: true },
      { key: 'assignmentStatus', label: '分发状态', type: 'radio', hiddenOnCreate: true, options: assignmentOptions, readonly: true },
      { key: 'isSuccess', label: '办理结果', type: 'radio', hiddenOnCreate: true, options: successOptions, readonly: true },
      { key: 'cardNumber', label: '办理号卡', hiddenOnCreate: true },
      { key: 'followStatus', label: '跟进情况', type: 'textarea' },
      { key: 'remark', label: '备注', type: 'textarea' },
    ],
  },
  outboundPersonnel: {
    key: 'outboundPersonnel',
    title: '人员管理',
    list: businessApi.listOutboundPersonnel,
    get: businessApi.getOutboundPersonnel,
    create: businessApi.createOutboundPersonnel,
    update: businessApi.updateOutboundPersonnel,
    remove: businessApi.deleteOutboundPersonnel,
    primaryKey: 'personName',
    secondaryKeys: ['userName', 'phone', 'roleName', 'businessType', 'grid'],
    badgeKey: 'status',
    badgeOptions: statusOptions,
    canCreate: true,
    searchFields: [
      { key: 'userName', label: '登录账号' },
      { key: 'personName', label: '人员姓名' },
      { key: 'phone', label: '联系电话' },
      { key: 'status', label: '状态', type: 'radio', options: statusOptions },
    ],
    formFields: [
      { key: 'userName', label: '登录账号', required: true },
      { key: 'personName', label: '人员姓名', required: true },
      { key: 'phone', label: '联系电话' },
      { key: 'roleId', label: '角色', type: 'picker', source: 'role', required: true },
      { key: 'businessType', label: '业务类型', type: 'multiPicker', source: 'businessType' },
      { key: 'grid', label: '网格', type: 'multiPicker', source: 'grid' },
      { key: 'status', label: '状态', type: 'radio', options: statusOptions },
      { key: 'remark', label: '备注', type: 'textarea' },
    ],
  },
  outboundGrid: {
    key: 'outboundGrid',
    title: '网格管理',
    list: businessApi.listGrid,
    get: businessApi.getGrid,
    create: businessApi.createGrid,
    update: businessApi.updateGrid,
    remove: businessApi.deleteGrid,
    primaryKey: 'gridName',
    secondaryKeys: ['gridCode', 'sortOrder', 'remark'],
    badgeKey: 'status',
    badgeOptions: statusOptions,
    canCreate: true,
    searchFields: [
      { key: 'gridCode', label: '网格编码' },
      { key: 'gridName', label: '网格名称' },
      { key: 'status', label: '状态', type: 'radio', options: statusOptions },
    ],
    formFields: [
      { key: 'gridCode', label: '网格编码', required: true },
      { key: 'gridName', label: '网格名称', required: true },
      { key: 'sortOrder', label: '显示排序', type: 'number' },
      { key: 'status', label: '状态', type: 'radio', options: statusOptions },
      { key: 'remark', label: '备注', type: 'textarea' },
    ],
  },
  bizPackage: {
    key: 'bizPackage',
    title: '套餐管理',
    list: businessApi.listPackage,
    get: businessApi.getPackage,
    create: businessApi.createPackage,
    update: businessApi.updatePackage,
    remove: businessApi.deletePackage,
    primaryKey: 'packageName',
    secondaryKeys: ['packageCode', 'businessType', 'price', 'description'],
    badgeKey: 'status',
    badgeOptions: enableOptions,
    canCreate: true,
    searchFields: [
      { key: 'packageName', label: '套餐名称' },
      { key: 'packageCode', label: '套餐编码' },
      { key: 'status', label: '状态', type: 'radio', options: enableOptions },
    ],
    formFields: [
      { key: 'packageName', label: '套餐名称', required: true },
      { key: 'packageCode', label: '套餐编码', required: true },
      { key: 'price', label: '套餐价格', type: 'number', required: true },
      { key: 'status', label: '状态', type: 'radio', options: enableOptions },
      { key: 'description', label: '套餐描述', type: 'textarea' },
    ],
  },
  customerInfo: {
    key: 'customerInfo',
    title: '客户信息',
    list: businessApi.listCustomer,
    get: businessApi.getCustomer,
    update: businessApi.updateCustomer,
    remove: businessApi.deleteCustomer,
    primaryKey: 'name',
    secondaryKeys: ['phone', 'storeUserName', 'packageName', 'address'],
    searchFields: [
      { key: 'name', label: '客户姓名' },
      { key: 'phone', label: '联系电话' },
      { key: 'packageName', label: '套餐名称' },
    ],
    formFields: [
      { key: 'storeUserName', label: '门店名称', readonly: true },
      { key: 'name', label: '客户姓名', required: true },
      { key: 'phone', label: '联系电话', required: true },
      { key: 'province', label: '省份' },
      { key: 'city', label: '城市' },
      { key: 'district', label: '区县' },
      { key: 'address', label: '详细地址', type: 'textarea' },
      { key: 'packageName', label: '办理套餐', readonly: true },
      { key: 'remark', label: '备注', type: 'textarea' },
    ],
  },
  storeList: {
    key: 'storeList',
    title: '门店列表',
    list: businessApi.listStore,
    get: businessApi.getOutboundPersonnel,
    primaryKey: 'personName',
    secondaryKeys: ['userName', 'phone', 'businessType', 'grid'],
    badgeKey: 'status',
    badgeOptions: statusOptions,
    readonly: true,
    searchFields: [
      { key: 'userName', label: '登录账号' },
      { key: 'personName', label: '门店名称' },
      { key: 'phone', label: '联系电话' },
      { key: 'status', label: '营业状态', type: 'radio', options: statusOptions },
    ],
    formFields: [
      { key: 'personName', label: '门店名称', readonly: true },
      { key: 'userName', label: '登录账号', readonly: true },
      { key: 'phone', label: '联系电话', readonly: true },
      { key: 'businessType', label: '业务类型', readonly: true, source: 'businessType' },
      { key: 'grid', label: '覆盖网格', readonly: true, source: 'grid' },
      { key: 'status', label: '营业状态', type: 'radio', options: statusOptions, readonly: true },
      { key: 'remark', label: '备注', type: 'textarea', readonly: true },
    ],
  },
  storeInfo: {
    key: 'storeInfo',
    title: '门店信息',
    list: businessApi.listStore,
    get: businessApi.getOutboundPersonnel,
    primaryKey: 'personName',
    secondaryKeys: ['userName', 'phone', 'businessType', 'grid'],
    badgeKey: 'status',
    badgeOptions: statusOptions,
    readonly: true,
    searchFields: [
      { key: 'personName', label: '门店名称' },
      { key: 'phone', label: '联系电话' },
    ],
    formFields: [
      { key: 'personName', label: '门店名称', readonly: true },
      { key: 'userName', label: '登录账号', readonly: true },
      { key: 'phone', label: '联系电话', readonly: true },
      { key: 'businessType', label: '业务类型', readonly: true, source: 'businessType' },
      { key: 'grid', label: '覆盖网格', readonly: true, source: 'grid' },
      { key: 'status', label: '营业状态', type: 'radio', options: statusOptions, readonly: true },
      { key: 'remark', label: '备注', type: 'textarea', readonly: true },
    ],
  },
  timeoutReminder: {
    key: 'timeoutReminder',
    title: '超时提醒',
    list: businessApi.listTimeoutReminders,
    primaryKey: 'customerNumber',
    secondaryKeys: ['packageName', 'grid', 'receiverName', 'orderTime', 'overdueDays'],
    badgeKey: 'assignmentStatus',
    badgeOptions: assignmentOptions,
    readonly: true,
    searchFields: [
      { key: 'customerNumber', label: '客户号码' },
      { key: 'packageName', label: '套餐' },
      { key: 'grid', label: '网格', source: 'grid' },
      { key: 'receiver', label: '接单人' },
      { key: 'receiverName', label: '接单人' },
      { key: 'orderTime', label: '接单时间' },
      { key: 'overdueDays', label: '已超时时长' },
    ],
    formFields: [],
  },
  assignmentTree: {
    key: 'assignmentTree',
    title: '分发记录',
    list: params => businessApi.getAssignmentTree(params).then(rows => ({ rows: flattenAssignmentTree(rows), total: flattenAssignmentTree(rows).length })),
    primaryKey: 'customerNumber',
    secondaryKeys: ['packageName', 'grid', 'assignedPersonName', 'claimedTime'],
    badgeKey: 'claimStatus',
    badgeOptions: claimOptions,
    readonly: true,
    searchFields: [
      { key: 'customerNumber', label: '客户号码' },
      { key: 'packageName', label: '套餐' },
      { key: 'grid', label: '网格', source: 'grid' },
      { key: 'receiver', label: '接单人' },
      { key: 'assignedPersonName', label: '接单人' },
      { key: 'claimedTime', label: '接单时间' },
    ],
    formFields: [],
  },
}

function flattenAssignmentTree(rows: any[] = []) {
  return rows.flatMap((row) => {
    const children = Array.isArray(row.children) ? row.children : []
    if (!children.length) {
      return [row]
    }
    return children.map(child => ({
      ...row,
      ...child,
      id: child.assignmentId || child.id || row.id,
      customerNumber: child.customerNumber || row.customerNumber,
      packageName: child.packageName || row.packageName,
      grid: child.grid || row.grid,
    }))
  })
}

export function getModuleConfig(module?: string) {
  return businessModules[(module || 'outboundRecord') as BusinessModuleKey] || businessModules.outboundRecord
}

export function getStatusLabel(key: string | undefined, value: any, options?: Array<{ label: string, value: string | number }>) {
  const strValue = String(value ?? '')
  const configured = options?.find(item => String(item.value) === strValue)
  if (configured) {
    return configured.label
  }
  if (key === 'assignmentStatus') {
    return assignmentOptions.find(item => item.value === strValue)?.label || '未知'
  }
  if (key === 'claimStatus') {
    return claimOptions.find(item => item.value === strValue)?.label || '未知'
  }
  if (key === 'status') {
    return [...statusOptions, ...enableOptions].find(item => item.value === strValue)?.label || '未知'
  }
  return strValue || '-'
}

export function getStatusType(key: string | undefined, value: any, options?: Array<{ label: string, value: string | number }>) {
  const strValue = String(value ?? '')
  if (key === 'assignmentStatus') {
    return strValue === '2' ? 'success' : strValue === '1' ? 'warning' : 'default'
  }
  if (key === 'claimStatus') {
    return strValue === '1' ? 'success' : 'warning'
  }
  if (key === 'status') {
    const enabledByOne = options?.some(item => item.label === '启用' && String(item.value) === '1')
    if (enabledByOne) {
      return strValue === '1' ? 'success' : 'danger'
    }
    return strValue === '0' ? 'success' : 'danger'
  }
  return 'default'
}

export interface SelectOption {
  label: string
  value: string | number
}

// 全局缓存下拉选项，避免重复请求
export const sourceOptionCache: Record<string, SelectOption[]> = {}

export async function loadSourceOptions(source: 'role' | 'businessType' | 'grid'): Promise<SelectOption[]> {
  // 命中缓存直接返回
  if (sourceOptionCache[source])
    return sourceOptionCache[source]
  try {
    let list: SelectOption[] = []
    switch (source) {
      case 'businessType': {
        const res = await businessApi.listBusinessTypeOptions()
        const dataList = Array.isArray(res) ? res : res.data ?? []
        list = dataList.map(item => ({
          label: item.dictLabel || item.label || '',
          // 统一转字符串，避免数字/字符串类型不匹配
          value: String(item.dictValue ?? item.value ?? ''),
        })).filter(item => item.label && item.value)
        break
      }
      case 'grid': {
        const res = await businessApi.listActiveGridOptions()
        const dataList = res.rows ?? []
        // 对齐form页面逻辑：value使用网格名称，和后端存储字段一致
        list = dataList.map(item => ({
          label: item.gridName || '',
          value: item.gridName || '',
        })).filter(item => item.label && item.value)
        break
      }
      case 'role': {
        const res = await businessApi.listRoleOptions()
        const dataList = res.rows ?? []
        list = dataList.map(item => ({
          label: item.roleName || '',
          value: item.roleId,
          roleKey: item.roleKey,
        })).filter(item => item.label && item.value)
        break
      }
    }
    sourceOptionCache[source] = list
    return list
  } catch (err) {
    console.error(`加载${source}下拉选项异常：`, err)
    return []
  }
}

/**
 * 异步翻译：适用于异步场景，自动加载缓存
 */
export async function getSourceLabel(
  sourceType: 'role' | 'businessType' | 'grid',
  value: string | number | string[] | number[] | null | undefined,
): Promise<string> {
  if (!value || (Array.isArray(value) && value.length === 0))
    return '-'
  const options = await loadSourceOptions(sourceType)
  const codeArr = Array.isArray(value) ? value : [value]
  return codeArr.map((code) => {
    const match = options.find(d => String(d.value) === String(code))
    return match?.label ?? String(code)
  }).join('、')
}

/**
 * 同步翻译：列表渲染用，依赖预加载的缓存数据，和form页面完全同源
 */
export function getSourceMultiLabel(
  sourceType: 'role' | 'businessType' | 'grid',
  value: string | string[] | number | number[] | null | undefined,
): string {
  if (!value || (Array.isArray(value) && value.length === 0))
    return '-'

  const cacheList = sourceOptionCache[sourceType] || []
  const codeArr = Array.isArray(value) ? value : [String(value)]
  return codeArr.map((code) => {
    const match = cacheList.find(d => String(d.value) === String(code))
    return match?.label ?? String(code)
  }).join('、')
}

// 预加载所有下拉缓存
export async function preloadAllSourceOptions() {
  await Promise.all([
    loadSourceOptions('businessType'),
    loadSourceOptions('grid'),
    loadSourceOptions('role'),
  ])
}
