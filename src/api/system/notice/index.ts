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

/** 获取首页顶部未读公告（带已读状态，前端工作台/APP弹窗使用） */
export function listNoticeTop() {
  return http.get<{
    data: SysNotice[]
    unreadCount: number
  }>(`${baseUrl}/listTop`)
}

/** 根据id获取公告详情 */
export function getNotice(noticeId: number) {
  return http.get<SysNotice>(`${baseUrl}/${noticeId}`)
}

/** 新增公告 */
export function createNotice(data: Omit<SysNotice, 'noticeId' | 'createBy' | 'createTime' | 'isRead'>) {
  return http.post<number>(`${baseUrl}`, data)
}

/** 修改公告 */
export function updateNotice(data: SysNotice) {
  return http.put<boolean>(`${baseUrl}`, data)
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
