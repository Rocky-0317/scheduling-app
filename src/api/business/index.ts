import { http } from '@/http/http'

export interface RuoYiPageResult<T> {
  code: number
  msg?: string
  rows: T[]
  total: number
}

export interface WorkbenchMetricCard {
  key: string
  title: string
  value: number
  description?: string
  icon?: string
  color?: string
}

export interface WorkbenchQuickEntry {
  title: string
  description?: string
  route: string
  icon?: string
  color?: string
}

export interface WorkbenchTaskStatus {
  key: string
  label: string
  value: number
  color?: string
}

export interface OutboundWorkbenchSummary {
  systemName?: string
  runStatus?: string
  version?: string
  currentDate?: string
  cards?: WorkbenchMetricCard[]
  quickEntries?: WorkbenchQuickEntry[]
  taskStatuses?: WorkbenchTaskStatus[]
}

export interface BusinessGrid {
  id?: number
  gridCode?: string
  gridName?: string
  sortOrder?: number
  status?: string
  remark?: string
  createTime?: string
}

export interface BusinessRole {
  roleId?: number
  roleName?: string
  roleKey?: string
  status?: string
}

export interface BusinessDictData {
  dictLabel?: string
  dictValue?: string
  label?: string
  value?: string
  status?: string
}

export interface BizPackage {
  id?: number
  businessType?: string
  packageName?: string
  packageCode?: string
  price?: string | number
  description?: string
  status?: string
  createTime?: string
}

export interface CustomerInfo {
  id?: number
  name?: string
  phone?: string
  province?: string
  city?: string
  district?: string
  address?: string
  remark?: string
  storeUserId?: number
  storeUserName?: string
  packageId?: number
  packageName?: string
  packagePrice?: string | number
  createTime?: string
}

export interface OutboundPersonnel {
  id?: number
  userId?: number
  userName?: string
  personName?: string
  phone?: string
  businessType?: string | string[]
  roleId?: number | string
  roleName?: string
  grid?: string | string[]
  status?: string
  remark?: string
  createTime?: string
}

export interface OutboundRecord {
  id?: number
  businessType?: string
  registerDate?: string
  registrant?: string
  customerNumber?: string
  packageName?: string
  grid?: string
  deliveryAddress?: string
  receiver?: string
  receiverName?: string
  orderTime?: string
  followStatus?: string
  modifyTime?: string
  remark?: string
  assignmentStatus?: string
  isSuccess?: string
  cardNumber?: string
  imageUrls?: string[]
  createTime?: string
}

export interface OutboundRecordTimeoutConfig {
  status: number
  timeoutDays?: number | null
}

export interface OutboundRecordTimeoutReminder extends OutboundRecord {
  timeoutDays?: number
  overdueDays?: number
}

export interface AssignmentTreeNode extends OutboundRecord {
  nodeType: 'record' | 'assignment'
  recordId: number
  assignmentId?: number
  assignUserName?: string
  assignedUserName?: string
  assignedPersonName?: string
  assignedTime?: string
  claimStatus?: string
  claimedUserName?: string
  claimedTime?: string
  children?: AssignmentTreeNode[]
}

// ========== APP版本VO，对应后端 AppLatestVersionVo ==========
export interface AppLatestVersionVo {
  id?: number
  appName?: string
  platform?: string
  versionName: string
  versionCode: number
  updateTitle: string
  updateContent: string
  forceUpdate: boolean
  apkDownloadUrl?: string
  apkFileName?: string
  apkFileSize?: number
  releaseTime?: string
}

function listByRuoyi<T>(url: string, params: Record<string, any>) {
  return http.get<RuoYiPageResult<T>>(url, params, undefined, { original: true })
}

function splitMultiValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value
  }
  if (!value) {
    return []
  }
  return String(value).split(',').map(item => item.trim()).filter(Boolean)
}

export function normalizePersonnelPayload<T extends OutboundPersonnel>(data: T) {
  return {
    ...data,
    businessType: splitMultiValue(data.businessType),
    grid: splitMultiValue(data.grid),
  }
}

export const businessApi = {
  workbenchSummary(params?: Record<string, any>) {
    return http.get<OutboundWorkbenchSummary>('/business/workbench/summary', params)
  },

  listOutboundRecord(params: Record<string, any>) {
    return listByRuoyi<OutboundRecord>('/business/outboundRecord/list', params)
  },
  getOutboundRecord(id: number) {
    return http.get<OutboundRecord>(`/business/outboundRecord/${id}`)
  },
  createOutboundRecord(data: OutboundRecord) {
    return http.post('/business/outboundRecord', data)
  },
  updateOutboundRecord(data: OutboundRecord) {
    return http.put('/business/outboundRecord', data)
  },
  deleteOutboundRecord(ids: number[]) {
    return http.delete(`/business/outboundRecord/${ids.join(',')}`)
  },
  claimOutboundRecord(id: number) {
    return http.post(`/business/outboundRecord/${id}/claim`)
  },
  uploadOutboundRecordImages(id: number, filePaths: string[]) {
    return Promise.all(filePaths.map(filePath =>
      new Promise((resolve, reject) => {
        uni.uploadFile({
          url: `/business/outboundRecord/${id}/images`,
          name: 'files',
          filePath,
          success: (res) => {
            try {
              const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
              if (res.statusCode >= 200 && res.statusCode < 300 && (data.code === 0 || data.code === 200)) {
                resolve(data)
              } else {
                reject(data)
              }
            } catch (error) {
              reject(error)
            }
          },
          fail: reject,
        })
      }),
    ))
  },
  getTimeoutConfig() {
    return http.get<OutboundRecordTimeoutConfig>('/business/outboundRecord/timeout/config')
  },
  saveTimeoutConfig(data: OutboundRecordTimeoutConfig) {
    return http.put('/business/outboundRecord/timeout/config', data)
  },
  listTimeoutReminders(params: Record<string, any>) {
    return http.get<RuoYiPageResult<OutboundRecordTimeoutReminder>>('/business/outboundRecord/timeout/reminders', params, undefined, { original: true })
  },
  getAssignmentTree(params: Record<string, any>) {
    return http.get<AssignmentTreeNode[]>('/business/outboundRecord/assignments/tree', params)
  },

  listOutboundPersonnel(params: Record<string, any>) {
    return listByRuoyi<OutboundPersonnel>('/business/outboundPersonnel/list', params)
  },
  listRoleOptions() {
    return listByRuoyi<BusinessRole>('/system/role/list', { pageNum: 1, pageSize: 10000, status: '0' })
  },
  listBusinessTypeOptions() {
    return http.get<BusinessDictData[]>('/system/dict/data/type/business_type')
  },
  listStore(params: Record<string, any>) {
    return listByRuoyi<OutboundPersonnel>('/business/outboundPersonnel/store/list', params)
  },
  getOutboundPersonnel(id: number) {
    return http.get<OutboundPersonnel>(`/business/outboundPersonnel/${id}`)
  },
  createOutboundPersonnel(data: OutboundPersonnel) {
    return http.post('/business/outboundPersonnel', normalizePersonnelPayload(data))
  },
  updateOutboundPersonnel(data: OutboundPersonnel) {
    return http.put('/business/outboundPersonnel', normalizePersonnelPayload(data))
  },
  deleteOutboundPersonnel(ids: number[]) {
    return http.delete(`/business/outboundPersonnel/${ids.join(',')}`)
  },

  listGrid(params: Record<string, any>) {
    return listByRuoyi<BusinessGrid>('/business/grid/list', params)
  },
  listActiveGridOptions() {
    return listByRuoyi<BusinessGrid>('/business/grid/list', { pageNum: 1, pageSize: 99999, status: '0' })
  },
  getGrid(id: number) {
    return http.get<BusinessGrid>(`/business/grid/${id}`)
  },
  createGrid(data: BusinessGrid) {
    return http.post('/business/grid', data)
  },
  updateGrid(data: BusinessGrid) {
    return http.put('/business/grid', data)
  },
  deleteGrid(ids: number[]) {
    return http.delete(`/business/grid/${ids.join(',')}`)
  },

  listPackage(params: Record<string, any>) {
    return listByRuoyi<BizPackage>('/api/package/list', params)
  },
  getPackage(id: number) {
    return http.get<BizPackage>(`/api/package/${id}`)
  },
  createPackage(data: BizPackage) {
    return http.post('/api/package', data)
  },
  updatePackage(data: BizPackage) {
    return http.put('/api/package', data)
  },
  deletePackage(ids: number[]) {
    return http.delete(`/api/package/${ids.join(',')}`)
  },

  listCustomer(params: Record<string, any>) {
    return listByRuoyi<CustomerInfo>('/api/customer/list', params)
  },
  getCustomer(id: number) {
    return http.get<CustomerInfo>(`/api/customer/${id}`)
  },
  updateCustomer(data: CustomerInfo) {
    return http.put(`/api/customer/${data.id}`, data)
  },
  deleteCustomer(ids: number[]) {
    return http.delete(`/api/customer/${ids.join(',')}`)
  },

  // ========== 获取最新APP版本接口 ==========
  getLatestAppVersion(params: {
    platform: string
    appName?: string
    tenantId?: number
    currentVersionCode?: number
    expirySeconds?: number
  }) {
    return http.get<AppLatestVersionVo>('/api/app/version/latest', params)
  },
}
