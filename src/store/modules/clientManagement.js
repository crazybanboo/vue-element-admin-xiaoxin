import {
  getClientList,
  getClientDetail,
  registerClient,
  updateClient,
  toggleClient,
  deleteClient,
  sendCommand,
  getClientStatistics
} from '@/api/client'

const state = {
  // 客户端列表数据
  clients: [],
  total: 0,
  loading: false,

  // 当前选中的客户端
  currentClient: null,

  // WebSocket连接状态
  connectionStatus: 'disconnected', // connected, disconnected, connecting, error
  websocket: null,
  lastUpdate: null,

  // 统计信息
  statistics: {
    total_clients: 0,
    online_clients: 0,
    offline_clients: 0,
    active_clients: 0,
    inactive_clients: 0
  },

  // 查询参数
  queryParams: {
    page: 1,
    per_page: 20,
    status: null,
    is_active: null,
    search: ''
  }
}

const mutations = {
  SET_CLIENTS(state, clients) {
    state.clients = clients
  },
  SET_TOTAL(state, total) {
    state.total = total
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_CURRENT_CLIENT(state, client) {
    state.currentClient = client
  },
  SET_CONNECTION_STATUS(state, status) {
    state.connectionStatus = status
  },
  SET_WEBSOCKET(state, websocket) {
    state.websocket = websocket
  },
  SET_LAST_UPDATE(state, time) {
    state.lastUpdate = time
  },
  SET_STATISTICS(state, stats) {
    state.statistics = { ...state.statistics, ...stats }
  },
  SET_QUERY_PARAMS(state, params) {
    state.queryParams = { ...state.queryParams, ...params }
  },

  // 更新单个客户端信息
  UPDATE_CLIENT(state, updatedClient) {
    const index = state.clients.findIndex(c => c.id === updatedClient.id)
    if (index !== -1) {
      state.clients.splice(index, 1, updatedClient)
    }
  },

  // 删除客户端
  REMOVE_CLIENT(state, clientId) {
    const index = state.clients.findIndex(c => c.id === clientId)
    if (index !== -1) {
      state.clients.splice(index, 1)
      state.total = Math.max(0, state.total - 1)
    }
  },

  // 添加客户端
  ADD_CLIENT(state, client) {
    state.clients.unshift(client)
    state.total += 1
  }
}

const actions = {
  // 获取客户端列表
  async fetchClients({ commit, state }) {
    commit('SET_LOADING', true)
    try {
      const response = await getClientList(state.queryParams)
      if (response.code === 20000) {
        commit('SET_CLIENTS', response.data.clients)
        commit('SET_TOTAL', response.data.total)
      }
      return response
    } catch (error) {
      console.error('获取客户端列表失败:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // 获取客户端详情
  async fetchClientDetail({ commit }, clientId) {
    try {
      const response = await getClientDetail(clientId)
      if (response.code === 20000) {
        commit('SET_CURRENT_CLIENT', response.data)
      }
      return response
    } catch (error) {
      console.error('获取客户端详情失败:', error)
      throw error
    }
  },

  // 注册客户端
  async registerClient({ commit, dispatch }, clientData) {
    try {
      const response = await registerClient(clientData)
      if (response.code === 20000) {
        commit('ADD_CLIENT', response.data)
        // 刷新统计信息
        dispatch('fetchStatistics')
      }
      return response
    } catch (error) {
      console.error('注册客户端失败:', error)
      throw error
    }
  },

  // 更新客户端
  async updateClient({ commit, dispatch }, { id, data }) {
    try {
      const response = await updateClient(id, data)
      if (response.code === 20000) {
        commit('UPDATE_CLIENT', response.data)
        // 如果是当前选中的客户端，更新详情
        if (commit.state.currentClient && commit.state.currentClient.id === id) {
          commit('SET_CURRENT_CLIENT', response.data)
        }
      }
      return response
    } catch (error) {
      console.error('更新客户端失败:', error)
      throw error
    }
  },

  // 启用/禁用客户端
  async toggleClient({ commit, dispatch }, { id, enable }) {
    try {
      const response = await toggleClient(id, enable)
      if (response.code === 20000) {
        commit('UPDATE_CLIENT', response.data)
        // 刷新统计信息
        dispatch('fetchStatistics')
      }
      return response
    } catch (error) {
      console.error('切换客户端状态失败:', error)
      throw error
    }
  },

  // 删除客户端
  async deleteClient({ commit, dispatch }, clientId) {
    try {
      const response = await deleteClient(clientId)
      if (response.code === 20000) {
        commit('REMOVE_CLIENT', clientId)
        // 刷新统计信息
        dispatch('fetchStatistics')
      }
      return response
    } catch (error) {
      console.error('删除客户端失败:', error)
      throw error
    }
  },

  // 发送命令
  async sendCommand({ commit }, { id, command }) {
    try {
      const response = await sendCommand(id, command)
      return response
    } catch (error) {
      console.error('发送命令失败:', error)
      throw error
    }
  },

  // 获取统计信息
  async fetchStatistics({ commit }) {
    try {
      const response = await getClientStatistics()
      if (response.code === 20000) {
        commit('SET_STATISTICS', response.data)
      }
      return response
    } catch (error) {
      console.error('获取统计信息失败:', error)
      throw error
    }
  },

  // 设置查询参数
  setQueryParams({ commit, dispatch }, params) {
    commit('SET_QUERY_PARAMS', params)
    // 自动刷新列表
    dispatch('fetchClients')
  },

  // 重置查询参数
  resetQueryParams({ commit, dispatch }) {
    const defaultParams = {
      page: 1,
      per_page: 20,
      status: null,
      is_active: null,
      search: ''
    }
    commit('SET_QUERY_PARAMS', defaultParams)
    dispatch('fetchClients')
  },

  // WebSocket 相关方法
  initWebSocket({ commit, dispatch }) {
    if (state.websocket) {
      return // 已经存在连接
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = process.env.VUE_APP_WS_URL || `${wsProtocol}//${window.location.host}`
    const wsUrl = `${wsHost}/ws/admin`

    commit('SET_CONNECTION_STATUS', 'connecting')

    try {
      const websocket = new WebSocket(wsUrl)

      websocket.onopen = () => {
        console.log('WebSocket连接已建立')
        commit('SET_CONNECTION_STATUS', 'connected')
        commit('SET_WEBSOCKET', websocket)
        commit('SET_LAST_UPDATE', new Date().toLocaleTimeString())
      }

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        dispatch('handleWebSocketMessage', data)
      }

      websocket.onclose = (event) => {
        console.log('WebSocket连接已关闭', event)
        commit('SET_CONNECTION_STATUS', 'disconnected')
        commit('SET_WEBSOCKET', null)

        // 5秒后自动重连
        setTimeout(() => {
          if (state.connectionStatus === 'disconnected') {
            dispatch('initWebSocket')
          }
        }, 5000)
      }

      websocket.onerror = (error) => {
        console.error('WebSocket错误:', error)
        commit('SET_CONNECTION_STATUS', 'error')
      }
    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
      commit('SET_CONNECTION_STATUS', 'error')
    }
  },

  // 处理WebSocket消息
  handleWebSocketMessage({ commit, dispatch }, data) {
    console.log('收到WebSocket消息:', data)

    switch (data.type) {
      case 'client_update':
        commit('UPDATE_CLIENT', data.client)
        commit('SET_LAST_UPDATE', new Date().toLocaleTimeString())
        break

      case 'heartbeat':
        commit('SET_LAST_UPDATE', new Date().toLocaleTimeString())
        // 刷新统计信息
        dispatch('fetchStatistics')
        break

      case 'client_connected':
        console.log(`客户端 ${data.client_id} 已连接`)
        commit('SET_LAST_UPDATE', new Date().toLocaleTimeString())
        break

      case 'client_disconnected':
        console.log(`客户端 ${data.client_id} 已断开`)
        commit('SET_LAST_UPDATE', new Date().toLocaleTimeString())
        break

      case 'command_ack':
        console.log(`客户端 ${data.client_id} 命令确认:`, data)
        break

      case 'connection_info':
        console.log('连接信息:', data.data)
        break

      default:
        console.log('未处理的消息类型:', data.type, data)
    }
  },

  // 断开WebSocket连接
  disconnectWebSocket({ commit, state }) {
    if (state.websocket) {
      state.websocket.close()
      commit('SET_WEBSOCKET', null)
      commit('SET_CONNECTION_STATUS', 'disconnected')
    }
  },

  // 发送WebSocket消息
  sendWebSocketMessage({ state }, message) {
    if (state.websocket && state.connectionStatus === 'connected') {
      state.websocket.send(JSON.stringify(message))
      return true
    }
    return false
  }
}

const getters = {
  // 在线客户端数量
  onlineClientsCount: state => {
    return state.clients.filter(client => client.status === 'online').length
  },

  // 离线客户端数量
  offlineClientsCount: state => {
    return state.clients.filter(client => client.status === 'offline').length
  },

  // 活跃客户端数量
  activeClientsCount: state => {
    return state.clients.filter(client => client.is_active).length
  },

  // 连接状态文本
  connectionStatusText: state => {
    const statusMap = {
      connected: '已连接',
      disconnected: '已断开',
      connecting: '连接中',
      error: '连接错误'
    }
    return statusMap[state.connectionStatus] || '未知'
  },

  // 连接状态样式
  connectionStatusType: state => {
    const typeMap = {
      connected: 'success',
      disconnected: 'info',
      connecting: 'warning',
      error: 'danger'
    }
    return typeMap[state.connectionStatus] || 'info'
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
