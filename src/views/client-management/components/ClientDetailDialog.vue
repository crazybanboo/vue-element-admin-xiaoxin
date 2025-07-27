<template>
  <el-dialog
    title="客户端详情"
    :visible.sync="dialogVisible"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="client" class="client-detail">
      <!-- 基本信息 -->
      <el-card class="detail-card">
        <div slot="header" class="card-header">
          <span>基本信息</span>
          <el-button
            size="mini"
            type="primary"
            icon="el-icon-refresh"
            @click="refreshDetail"
          >
            刷新
          </el-button>
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <span class="label">客户端ID:</span>
              <span class="value">{{ client.client_id }}</span>
            </div>
            <div class="info-item">
              <span class="label">主机名:</span>
              <span class="value">{{ client.hostname }}</span>
            </div>
            <div class="info-item">
              <span class="label">IP地址:</span>
              <span class="value">{{ client.ip_address }}</span>
            </div>
            <div class="info-item">
              <span class="label">版本:</span>
              <span class="value">{{ client.version || '未知' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <span class="label">状态:</span>
              <el-tag :type="getStatusType(client.status)">
                {{ getStatusText(client.status) }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">激活状态:</span>
              <el-tag :type="client.is_active ? 'success' : 'info'">
                {{ client.is_active ? '已激活' : '已禁用' }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">平台:</span>
              <span class="value">{{ client.platform || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="label">激活状态:</span>
              <el-tag :type="getActivationStatusType(client.activation_status)">
                {{ getActivationStatusText(client.activation_status) }}
              </el-tag>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="time-info">
          <el-col :span="12">
            <div class="info-item">
              <span class="label">最后心跳:</span>
              <span class="value">{{ formatTime(client.last_heartbeat) }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatTime(client.created_at) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <span class="label">更新时间:</span>
              <span class="value">{{ formatTime(client.updated_at) }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 操作按钮 -->
      <el-card class="detail-card">
        <div slot="header" class="card-header">
          <span>客户端操作</span>
        </div>

        <div class="action-buttons">
          <el-button
            v-if="client.is_active"
            type="warning"
            icon="el-icon-video-pause"
            @click="handleToggle(false)"
          >
            禁用客户端
          </el-button>
          <el-button
            v-else
            type="success"
            icon="el-icon-video-play"
            @click="handleToggle(true)"
          >
            启用客户端
          </el-button>

          <el-button
            type="primary"
            icon="el-icon-refresh"
            @click="handleRestart"
          >
            重启客户端
          </el-button>

          <el-button
            type="info"
            icon="el-icon-upload"
            @click="handleUpdate"
          >
            强制更新
          </el-button>

          <el-button
            type="danger"
            icon="el-icon-delete"
            @click="handleDelete"
          >
            删除客户端
          </el-button>
        </div>
      </el-card>

      <!-- 心跳记录 -->
      <el-card v-if="detailData && detailData.recent_heartbeats" class="detail-card">
        <div slot="header" class="card-header">
          <span>最近心跳记录</span>
          <span class="record-count">(最近20条)</span>
        </div>

        <el-table
          :data="detailData.recent_heartbeats"
          size="mini"
          max-height="300"
        >
          <el-table-column label="时间" width="180">
            <template slot-scope="{row}">
              {{ formatTime(row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column label="CPU使用率" width="100">
            <template slot-scope="{row}">
              <el-progress
                :percentage="Math.round(row.cpu_usage)"
                :color="getProgressColor(row.cpu_usage)"
                :show-text="false"
                :stroke-width="6"
              />
              <span class="progress-text">{{ Math.round(row.cpu_usage) }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="内存使用率" width="100">
            <template slot-scope="{row}">
              <el-progress
                :percentage="Math.round(row.memory_usage)"
                :color="getProgressColor(row.memory_usage)"
                :show-text="false"
                :stroke-width="6"
              />
              <span class="progress-text">{{ Math.round(row.memory_usage) }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="活跃任务" width="80" align="center">
            <template slot-scope="{row}">
              <el-tag size="mini" :type="row.active_tasks > 0 ? 'success' : 'info'">
                {{ row.active_tasks }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="扩展数据" min-width="150">
            <template slot-scope="{row}">
              <span v-if="row.status_data">
                {{ JSON.stringify(row.status_data) }}
              </span>
              <span v-else class="text-muted">无</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 待处理命令 -->
      <el-card v-if="detailData && detailData.pending_commands" class="detail-card">
        <div slot="header" class="card-header">
          <span>待处理命令</span>
          <el-badge
            :value="detailData.pending_commands.length"
            :hidden="detailData.pending_commands.length === 0"
            class="command-badge"
          />
        </div>

        <el-table
          v-if="detailData.pending_commands.length > 0"
          :data="detailData.pending_commands"
          size="mini"
        >
          <el-table-column label="命令类型" width="120">
            <template slot-scope="{row}">
              <el-tag size="mini">{{ getCommandTypeText(row.command_type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template slot-scope="{row}">
              <el-tag size="mini" :type="getCommandStatusType(row.status)">
                {{ getCommandStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template slot-scope="{row}">
              {{ formatTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="参数" min-width="150">
            <template slot-scope="{row}">
              <span v-if="row.payload">
                {{ JSON.stringify(row.payload) }}
              </span>
              <span v-else class="text-muted">无</span>
            </template>
          </el-table-column>
        </el-table>

        <div v-else class="empty-state">
          <i class="el-icon-success" />
          <p>暂无待处理命令</p>
        </div>
      </el-card>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">关闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'ClientDetailDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    client: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      detailData: null,
      loading: false
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },
  watch: {
    visible(val) {
      if (val && this.client) {
        this.fetchDetailData()
      }
    }
  },
  methods: {
    ...mapActions('clientManagement', [
      'fetchClientDetail',
      'toggleClient',
      'deleteClient',
      'sendCommand'
    ]),

    // 获取详细数据
    async fetchDetailData() {
      if (!this.client) return

      this.loading = true
      try {
        const response = await this.fetchClientDetail(this.client.id)
        if (response.code === 20000) {
          this.detailData = response.data
        }
      } catch (error) {
        this.$message.error('获取客户端详情失败')
        console.error(error)
      } finally {
        this.loading = false
      }
    },

    // 刷新详情
    refreshDetail() {
      this.fetchDetailData()
    },

    // 关闭对话框
    handleClose() {
      this.dialogVisible = false
      this.detailData = null
    },

    // 启用/禁用
    async handleToggle(enable) {
      const action = enable ? '启用' : '禁用'
      try {
        await this.$confirm(`确定要${action}此客户端吗？`, '确认操作', {
          type: 'warning'
        })

        await this.toggleClient({ id: this.client.id, enable })
        this.$message.success(`客户端${action}成功`)
        this.$emit('refresh')
        this.refreshDetail()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(`客户端${action}失败`)
        }
      }
    },

    // 重启客户端
    async handleRestart() {
      try {
        await this.$confirm('确定要重启此客户端吗？', '确认操作', {
          type: 'warning'
        })

        await this.sendCommand({
          id: this.client.id,
          command: { command_type: 'restart' }
        })
        this.$message.success('重启命令已发送')
        this.refreshDetail()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('发送重启命令失败')
        }
      }
    },

    // 强制更新
    async handleUpdate() {
      try {
        await this.$confirm('确定要强制更新此客户端吗？', '确认操作', {
          type: 'warning'
        })

        await this.sendCommand({
          id: this.client.id,
          command: { command_type: 'upgrade' }
        })
        this.$message.success('更新命令已发送')
        this.refreshDetail()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('发送更新命令失败')
        }
      }
    },

    // 删除客户端
    async handleDelete() {
      try {
        await this.$confirm(
          `确定要删除客户端 "${this.client.client_id}" 吗？此操作不可撤销！`,
          '危险操作',
          {
            type: 'error',
            confirmButtonClass: 'el-button--danger'
          }
        )

        await this.deleteClient(this.client.id)
        this.$message.success('客户端删除成功')
        this.$emit('refresh')
        this.handleClose()
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

    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        'online': '在线',
        'offline': '离线',
        'error': '错误'
      }
      return textMap[status] || status
    },

    // 获取激活状态样式
    getActivationStatusType(status) {
      const statusMap = {
        'pending': 'warning',
        'activated': 'success',
        'expired': 'danger'
      }
      return statusMap[status] || 'info'
    },

    // 获取激活状态文本
    getActivationStatusText(status) {
      const textMap = {
        'pending': '待激活',
        'activated': '已激活',
        'expired': '已过期'
      }
      return textMap[status] || status
    },

    // 获取命令类型文本
    getCommandTypeText(type) {
      const typeMap = {
        'enable': '启用',
        'disable': '禁用',
        'restart': '重启',
        'upgrade': '更新',
        'get_status': '获取状态'
      }
      return typeMap[type] || type
    },

    // 获取命令状态样式
    getCommandStatusType(status) {
      const statusMap = {
        'pending': 'warning',
        'sent': 'primary',
        'acknowledged': 'success',
        'failed': 'danger'
      }
      return statusMap[status] || 'info'
    },

    // 获取命令状态文本
    getCommandStatusText(status) {
      const textMap = {
        'pending': '待处理',
        'sent': '已发送',
        'acknowledged': '已确认',
        'failed': '失败'
      }
      return textMap[status] || status
    },

    // 获取进度条颜色
    getProgressColor(value) {
      if (value < 50) return '#67C23A'
      if (value < 80) return '#E6A23C'
      return '#F56C6C'
    },

    // 格式化时间
    formatTime(time) {
      if (!time) return '从未'
      return new Date(time).toLocaleString()
    }
  }
}
</script>

<style lang="scss" scoped>
.client-detail {
  .detail-card {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .record-count {
        font-size: 12px;
        color: #909399;
      }

      .command-badge {
        margin-left: 8px;
      }
    }
  }

  .info-item {
    display: flex;
    margin-bottom: 15px;

    .label {
      width: 100px;
      color: #909399;
      font-size: 14px;
    }

    .value {
      flex: 1;
      color: #303133;
      font-size: 14px;
    }
  }

  .time-info {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #EBEEF5;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .progress-text {
    margin-left: 8px;
    font-size: 12px;
    color: #606266;
  }

  .empty-state {
    text-align: center;
    padding: 40px 0;
    color: #909399;

    i {
      font-size: 48px;
      margin-bottom: 16px;
      color: #C0C4CC;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  .text-muted {
    color: #C0C4CC;
    font-style: italic;
  }
}

.dialog-footer {
  text-align: right;
}

// 响应式设计
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }

  .info-item {
    flex-direction: column;

    .label {
      width: auto;
      margin-bottom: 4px;
    }
  }
}
</style>
