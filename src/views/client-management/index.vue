<template>
  <div class="client-management-container">
    <div class="app-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h2>客户端管理</h2>
        <p>监控和管理所有 RPA 客户端的状态和操作</p>
      </div>

      <!-- 统计卡片 -->
      <div class="statistics-cards">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ statistics.total_clients }}</div>
                <div class="stat-label">总客户端</div>
              </div>
              <i class="el-icon-monitor stat-icon total" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ statistics.online_clients }}</div>
                <div class="stat-label">在线客户端</div>
              </div>
              <i class="el-icon-success stat-icon online" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ statistics.offline_clients }}</div>
                <div class="stat-label">离线客户端</div>
              </div>
              <i class="el-icon-warning stat-icon offline" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ statistics.active_clients }}</div>
                <div class="stat-label">活跃客户端</div>
              </div>
              <i class="el-icon-circle-check stat-icon active" />
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 筛选和操作区域 -->
      <div class="filter-container">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-input
              v-model="queryParams.search"
              placeholder="搜索客户端ID、主机名或IP地址..."
              class="filter-item"
              clearable
              @keyup.enter.native="handleSearch"
              @clear="handleSearch"
            >
              <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="queryParams.status"
              placeholder="状态"
              clearable
              class="filter-item"
              @change="handleFilter"
            >
              <el-option label="在线" value="online" />
              <el-option label="离线" value="offline" />
              <el-option label="错误" value="error" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="queryParams.is_active"
              placeholder="激活状态"
              clearable
              class="filter-item"
              @change="handleFilter"
            >
              <el-option label="已激活" :value="true" />
              <el-option label="已禁用" :value="false" />
            </el-select>
          </el-col>
        </el-row>

        <div class="action-buttons">
          <el-button
            type="primary"
            icon="el-icon-refresh"
            @click="refreshData"
          >
            刷新
          </el-button>
          <el-button
            type="success"
            icon="el-icon-plus"
            @click="showRegisterDialog"
          >
            注册客户端
          </el-button>
        </div>
      </div>

      <!-- 连接状态提示 -->
      <el-alert
        :title="connectionStatusMessage"
        :type="connectionStatusType"
        show-icon
        :closable="false"
        class="connection-status"
      />

      <!-- 客户端表格 -->
      <el-table
        v-loading="loading"
        :data="clients"
        border
        fit
        highlight-current-row
        style="width: 100%;"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="客户端ID" min-width="150" prop="client_id">
          <template slot-scope="{row}">
            <el-link type="primary" @click="viewClientDetail(row)">
              {{ row.client_id }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column label="主机名" min-width="120" prop="hostname" />

        <el-table-column label="IP地址" min-width="120" prop="ip_address" />

        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="{row}">
            <el-tag :type="getStatusType(row.status)" effect="dark">
              <i :class="getStatusIcon(row.status)" style="margin-right: 4px;" />
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="激活状态" width="100" align="center">
          <template slot-scope="{row}">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? '已激活' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="最后心跳" width="160" align="center">
          <template slot-scope="{row}">
            <span v-if="row.last_heartbeat">
              {{ formatTime(row.last_heartbeat) }}
            </span>
            <span v-else class="text-muted">从未</span>
          </template>
        </el-table-column>

        <el-table-column label="版本" width="100" align="center">
          <template slot-scope="{row}">
            <span>{{ row.version || '未知' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="平台" width="120" align="center">
          <template slot-scope="{row}">
            <span>{{ row.platform || '未知' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="240" fixed="right">
          <template slot-scope="{row}">
            <el-button
              size="mini"
              type="primary"
              @click="viewClientDetail(row)"
            >
              详情
            </el-button>

            <el-button
              v-if="row.is_active"
              size="mini"
              type="warning"
              @click="handleToggleClient(row, false)"
            >
              禁用
            </el-button>
            <el-button
              v-else
              size="mini"
              type="success"
              @click="handleToggleClient(row, true)"
            >
              启用
            </el-button>

            <el-dropdown @command="handleCommand">
              <el-button size="mini" type="info">
                更多<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item :command="{action: 'restart', row}">重启</el-dropdown-item>
                <el-dropdown-item :command="{action: 'update', row}">更新</el-dropdown-item>
                <el-dropdown-item :command="{action: 'delete', row}" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.page"
        :limit.sync="queryParams.per_page"
        @pagination="fetchClients"
      />

      <!-- 客户端详情对话框 -->
      <client-detail-dialog
        :visible.sync="detailDialogVisible"
        :client="selectedClient"
        @refresh="refreshData"
      />

      <!-- 注册客户端对话框 -->
      <client-register-dialog
        :visible.sync="registerDialogVisible"
        @refresh="refreshData"
      />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import Pagination from '@/components/Pagination'
import ClientDetailDialog from './components/ClientDetailDialog'
import ClientRegisterDialog from './components/ClientRegisterDialog'

export default {
  name: 'ClientManagement',
  components: {
    Pagination,
    ClientDetailDialog,
    ClientRegisterDialog
  },
  data() {
    return {
      selectedClients: [],
      selectedClient: null,
      detailDialogVisible: false,
      registerDialogVisible: false
    }
  },
  computed: {
    ...mapState('clientManagement', [
      'clients',
      'total',
      'loading',
      'connectionStatus',
      'lastUpdate',
      'statistics',
      'queryParams'
    ]),
    ...mapGetters('clientManagement', [
      'connectionStatusText',
      'connectionStatusType'
    ]),

    connectionStatusMessage() {
      const status = this.connectionStatusText
      const time = this.lastUpdate ? ` | 最后更新: ${this.lastUpdate}` : ''
      const count = ` | 客户端: ${this.clients.length}`
      return `WebSocket: ${status}${count}${time}`
    }
  },
  created() {
    this.initData()
  },
  beforeDestroy() {
    // 组件销毁时断开WebSocket连接
    this.disconnectWebSocket()
  },
  methods: {
    ...mapActions('clientManagement', [
      'fetchClients',
      'fetchStatistics',
      'toggleClient',
      'deleteClient',
      'sendCommand',
      'setQueryParams',
      'resetQueryParams',
      'initWebSocket',
      'disconnectWebSocket'
    ]),

    // 初始化数据
    async initData() {
      try {
        // 并行加载数据和建立WebSocket连接
        await Promise.all([
          this.fetchClients(),
          this.fetchStatistics()
        ])
        this.initWebSocket()
      } catch (error) {
        this.$message.error('初始化数据失败')
        console.error(error)
      }
    },

    // 刷新数据
    async refreshData() {
      try {
        await Promise.all([
          this.fetchClients(),
          this.fetchStatistics()
        ])
        this.$message.success('数据刷新成功')
      } catch (error) {
        this.$message.error('刷新数据失败')
      }
    },

    // 搜索
    handleSearch() {
      this.setQueryParams({ ...this.queryParams, page: 1 })
    },

    // 筛选
    handleFilter() {
      this.setQueryParams({ ...this.queryParams, page: 1 })
    },

    // 多选变化
    handleSelectionChange(selection) {
      this.selectedClients = selection
    },

    // 查看客户端详情
    viewClientDetail(client) {
      this.selectedClient = client
      this.detailDialogVisible = true
    },

    // 显示注册对话框
    showRegisterDialog() {
      this.registerDialogVisible = true
    },

    // 启用/禁用客户端
    async handleToggleClient(client, enable) {
      const action = enable ? '启用' : '禁用'
      try {
        await this.$confirm(`确定要${action}客户端 "${client.client_id}" 吗？`, '确认操作', {
          type: 'warning'
        })

        await this.toggleClient({ id: client.id, enable })
        this.$message.success(`客户端${action}成功`)
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(`客户端${action}失败`)
        }
      }
    },

    // 处理下拉菜单命令
    async handleCommand({ action, row }) {
      switch (action) {
        case 'restart':
          await this.handleRestartClient(row)
          break
        case 'update':
          await this.handleUpdateClient(row)
          break
        case 'delete':
          await this.handleDeleteClient(row)
          break
      }
    },

    // 重启客户端
    async handleRestartClient(client) {
      try {
        await this.$confirm(`确定要重启客户端 "${client.client_id}" 吗？`, '确认操作', {
          type: 'warning'
        })

        await this.sendCommand({
          id: client.id,
          command: { command_type: 'restart' }
        })
        this.$message.success('重启命令已发送')
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('发送重启命令失败')
        }
      }
    },

    // 更新客户端
    async handleUpdateClient(client) {
      try {
        await this.$confirm(`确定要强制更新客户端 "${client.client_id}" 吗？`, '确认操作', {
          type: 'warning'
        })

        await this.sendCommand({
          id: client.id,
          command: { command_type: 'upgrade' }
        })
        this.$message.success('更新命令已发送')
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('发送更新命令失败')
        }
      }
    },

    // 删除客户端
    async handleDeleteClient(client) {
      try {
        await this.$confirm(
          `确定要删除客户端 "${client.client_id}" 吗？此操作不可撤销！`,
          '危险操作',
          {
            type: 'error',
            confirmButtonClass: 'el-button--danger'
          }
        )

        await this.deleteClient(client.id)
        this.$message.success('客户端删除成功')
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除客户端失败')
        }
      }
    },

    // 获取状态样式
    getStatusType(status) {
      const statusMap = {
        'online': 'success',
        'offline': 'info',
        'error': 'danger'
      }
      return statusMap[status] || 'info'
    },

    // 获取状态图标
    getStatusIcon(status) {
      const iconMap = {
        'online': 'el-icon-success',
        'offline': 'el-icon-warning',
        'error': 'el-icon-error'
      }
      return iconMap[status] || 'el-icon-info'
    },

    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        'online': '在线',
        'offline': '离线',
        'error': '错误'
      }
      return textMap[status] || status
    },

    // 格式化时间
    formatTime(time) {
      if (!time) return '从未'
      const date = new Date(time)
      const now = new Date()
      const diff = now - date

      if (diff < 60000) { // 1分钟内
        return '刚刚'
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`
      } else if (diff < 86400000) { // 24小时内
        return `${Math.floor(diff / 3600000)}小时前`
      } else {
        return date.toLocaleString()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.client-management-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;

  h2 {
    margin: 0 0 8px 0;
    color: #303133;
  }

  p {
    margin: 0;
    color: #909399;
    font-size: 14px;
  }
}

.statistics-cards {
  margin-bottom: 30px;

  .stat-card {
    position: relative;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-content {
      .stat-number {
        font-size: 32px;
        font-weight: bold;
        color: #303133;
        line-height: 1;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }

    .stat-icon {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 40px;
      opacity: 0.8;

      &.total { color: #409EFF; }
      &.online { color: #67C23A; }
      &.offline { color: #F56C6C; }
      &.active { color: #E6A23C; }
    }
  }
}

.filter-container {
  margin-bottom: 20px;

  .filter-item {
    width: 100%;
  }

  .action-buttons {
    margin-top: 15px;
    display: flex;
    gap: 10px;
  }
}

.connection-status {
  margin-bottom: 20px;
}

.text-muted {
  color: #C0C4CC;
}

// 响应式设计
@media (max-width: 768px) {
  .statistics-cards {
    .el-col {
      margin-bottom: 15px;
    }
  }

  .filter-container {
    .el-col {
      margin-bottom: 10px;
    }
  }

  .el-table {
    font-size: 12px;
  }
}
</style>
