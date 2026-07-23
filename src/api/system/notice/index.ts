import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

const baseUrl = '/system/notice'

/** 通知公告实体（对齐后端 SysNotice） */
export interface SysNotice {
  noticeId?: number
  noticeTitle: string
  noticeContent: string
  noticeType: string // 1通知 2公告
  status: number // 0正常 1关闭
  remark?: string
  createBy?: string
  createTime?: string
  isRead?: boolean // 当前用户是否已读（listTop接口返回）
}

/** 旧页面使用的通知公告字段 */
export interface Notice {
  id?: number
  title: string
  content: string
  type?: number | string
  status?: number
  remark?: string
  createTime?: string
}

/** 分页查询参数 */
export type NoticeQuery = PageParam & {
  noticeTitle?: string
  noticeType?: number
  status?: number
}

/** 获取通知公告分页列表（后台管理列表） */
export function listNotice(params: NoticeQuery) {
  return http.get<PageResult<SysNotice>>(`${baseUrl}/list`, params)
}

/** 获取通知公告分页列表（兼容旧页面字段） */
export async function getNoticePage(params: PageParam & Record<string, any>) {
  const data = await listNotice({
    ...params,
    noticeTitle: params.noticeTitle ?? params.title,
    noticeType: params.noticeType ?? params.type,
  })
  return {
    list: (data.list || []).map(normalizeNotice),
    total: data.total || 0,
  } as PageResult<Notice>
}

/** 获取首页顶部未读公告（带已读状态，前端工作台/APP弹窗使用） */
export function listNoticeTop() {
  return http.get<{
    data: SysNotice[]
    unreadCount: number
  }>(`${baseUrl}/listTop`)
}

/** 根据id获取公告详情 */
export async function getNotice(noticeId: number): Promise<Notice & SysNotice> {
  const data = await http.get<SysNotice>(`${baseUrl}/${noticeId}`)
  return normalizeNotice(data)
}

/** 新增公告 */
export function createNotice(data: Omit<Notice, 'id' | 'createTime'>) {
  return http.post<number>(`${baseUrl}`, toSysNotice(data))
}

/** 修改公告 */
export function updateNotice(data: Notice) {
  return http.put<boolean>(`${baseUrl}`, toSysNotice(data))
}

/** 删除公告（批量） */
export function deleteNotice(noticeIds: number[]) {
  return http.delete<boolean>(`${baseUrl}/${noticeIds.join(',')}`)
}

/** 标记单条公告已读 */
export function markNoticeRead(noticeId: number) {
  return http.post(`${baseUrl}/markRead`, { noticeId })
}

/** 批量标记全部已读 */
export function markNoticeReadAll(ids: string) {
  return http.post(`${baseUrl}/markReadAll`, { ids })
}

/** 获取公告已读用户分页 */
export function getNoticeReadUserPage(params: PageParam & { noticeId: number, searchValue?: string }) {
  return http.get<PageResult<any>>(`${baseUrl}/readUsers/list`, params)
}

function normalizeNotice(data: SysNotice): Notice & SysNotice {
  return {
    ...data,
    id: data.noticeId,
    title: data.noticeTitle,
    content: data.noticeContent,
    type: data.noticeType,
    status: data.status,
    remark: data.remark,
    createTime: data.createTime,
  }
}

function toSysNotice(data: Omit<Notice, 'createTime'>): Omit<SysNotice, 'createBy' | 'createTime' | 'isRead'> {
  return {
    noticeId: data.id,
    noticeTitle: data.title,
    noticeContent: data.content,
    noticeType: String(data.type ?? ''),
    status: data.status ?? 0,
    remark: data.remark,
  }
}
