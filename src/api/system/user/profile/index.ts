import { http } from '@/http/http'

/** 用户角色子项（对齐后端返回roles） */
export interface UserProfileRoleVO {
  roleId: number
  roleName: string
  roleKey: string
}

/** 用户部门子项 */
export interface UserProfileDeptVO {
  deptId: number
  deptName: string
}

/** 用户岗位子项 */
export interface UserProfilePostVO {
  postId: number
  postName: string
}

/** 用户个人中心信息 */
export interface UserProfileVO {
  userId: number
  userName: string
  nickName: string
  email?: string
  phonenumber?: string
  sex?: string
  avatar?: string
  loginIp?: string
  loginDate?: string
  createTime?: string
  roles?: UserProfileRoleVO[]
  dept?: UserProfileDeptVO
  posts?: UserProfilePostVO[]
}

/** 更新个人信息请求 */
export interface UpdateProfileReqVO {
  nickName?: string
  email?: string
  phonenumber?: string
  sex?: string
  avatar?: string
}

/** 更新密码请求 */
export interface UpdatePasswordReqVO {
  oldPassword: string
  newPassword: string
}

/** 获取登录用户个人信息 */
export function getUserProfile() {
  return http.get<UserProfileVO>('/system/user/profile')
}

/** 修改用户个人信息 */
export function updateUserProfile(data: UpdateProfileReqVO) {
  return http.put<boolean>('/system/user/profile/update', data)
}

/** 修改用户个人密码 */
export function updateUserPassword(data: UpdatePasswordReqVO) {
  return http.put<boolean>('/system/user/profile/update-password', data)
}
