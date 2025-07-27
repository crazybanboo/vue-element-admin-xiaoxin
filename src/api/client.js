import request from '@/utils/request'

/**
 * 客户端管理API
 */

// 获取客户端列表
export function getClientList(query) {
  return request({
    url: '/clients',
    method: 'get',
    params: query
  })
}

// 获取客户端详情
export function getClientDetail(id) {
  return request({
    url: `/clients/${id}`,
    method: 'get'
  })
}

// 注册客户端
export function registerClient(data) {
  return request({
    url: '/clients/register',
    method: 'post',
    data
  })
}

// 更新客户端信息
export function updateClient(id, data) {
  return request({
    url: `/clients/${id}`,
    method: 'put',
    data
  })
}

// 启用/禁用客户端
export function toggleClient(id, enable) {
  return request({
    url: `/clients/${id}/toggle`,
    method: 'put',
    data: { enable }
  })
}

// 删除客户端
export function deleteClient(id) {
  return request({
    url: `/clients/${id}`,
    method: 'delete'
  })
}

// 发送命令到客户端
export function sendCommand(id, command) {
  return request({
    url: `/clients/${id}/commands`,
    method: 'post',
    data: command
  })
}

// 发送心跳数据
export function sendHeartbeat(data) {
  return request({
    url: '/clients/heartbeat',
    method: 'post',
    data
  })
}

// 获取客户端统计信息
export function getClientStatistics() {
  return request({
    url: '/clients/statistics/overview',
    method: 'get'
  })
}
