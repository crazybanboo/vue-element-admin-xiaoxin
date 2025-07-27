<template>
  <el-dialog
    title="注册客户端"
    :visible.sync="dialogVisible"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="registerForm"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <el-form-item label="客户端ID" prop="client_id" required>
        <el-input
          v-model="form.client_id"
          placeholder="请输入唯一的客户端标识，如：rpa_client_001"
          maxlength="255"
          show-word-limit
        />
        <div class="help-text">
          建议使用有意义的命名，如：部门_设备_编号
        </div>
      </el-form-item>

      <el-form-item label="主机名" prop="hostname" required>
        <el-input
          v-model="form.hostname"
          placeholder="请输入主机名，如：DESKTOP-ABC123"
          maxlength="255"
          show-word-limit
        />
        <div class="help-text">
          客户端设备的计算机名称
        </div>
      </el-form-item>

      <el-form-item label="IP地址" prop="ip_address" required>
        <el-input
          v-model="form.ip_address"
          placeholder="请输入IP地址，如：192.168.1.100"
          maxlength="45"
        />
        <div class="help-text">
          客户端设备的网络IP地址
        </div>
      </el-form-item>

      <el-form-item label="版本" prop="version">
        <el-input
          v-model="form.version"
          placeholder="请输入客户端版本，如：1.0.0"
          maxlength="50"
        />
        <div class="help-text">
          RPA客户端软件版本号（可选）
        </div>
      </el-form-item>

      <el-form-item label="操作系统" prop="platform">
        <el-select
          v-model="form.platform"
          placeholder="请选择操作系统"
          style="width: 100%;"
          filterable
          allow-create
        >
          <el-option label="Windows 10" value="Windows 10" />
          <el-option label="Windows 11" value="Windows 11" />
          <el-option label="Windows Server 2019" value="Windows Server 2019" />
          <el-option label="Windows Server 2022" value="Windows Server 2022" />
          <el-option label="Ubuntu 20.04" value="Ubuntu 20.04" />
          <el-option label="Ubuntu 22.04" value="Ubuntu 22.04" />
          <el-option label="CentOS 7" value="CentOS 7" />
          <el-option label="CentOS 8" value="CentOS 8" />
          <el-option label="macOS" value="macOS" />
        </el-select>
        <div class="help-text">
          客户端运行的操作系统平台（可选）
        </div>
      </el-form-item>
    </el-form>

    <!-- 注册说明 -->
    <el-alert
      title="注册说明"
      type="info"
      :closable="false"
      show-icon
      class="register-info"
    >
      <template slot="title">
        <div class="info-title">注册说明</div>
      </template>
      <ul class="info-list">
        <li>客户端ID必须唯一，建议使用有意义的命名规则</li>
        <li>IP地址应为客户端设备的实际网络地址</li>
        <li>注册后客户端将处于离线状态，需要启动RPA客户端程序建立连接</li>
        <li>版本和平台信息可在客户端首次连接时自动更新</li>
      </ul>
    </el-alert>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '注册中...' : '确认注册' }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'ClientRegisterDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      submitting: false,
      form: {
        client_id: '',
        hostname: '',
        ip_address: '',
        version: '',
        platform: ''
      },
      rules: {
        client_id: [
          { required: true, message: '请输入客户端ID', trigger: 'blur' },
          { min: 1, max: 255, message: '长度在 1 到 255 个字符', trigger: 'blur' },
          { pattern: /^[a-zA-Z0-9_-]+$/, message: '只能包含字母、数字、下划线和横线', trigger: 'blur' }
        ],
        hostname: [
          { required: true, message: '请输入主机名', trigger: 'blur' },
          { min: 1, max: 255, message: '长度在 1 到 255 个字符', trigger: 'blur' }
        ],
        ip_address: [
          { required: true, message: '请输入IP地址', trigger: 'blur' },
          { pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, message: '请输入正确的IP地址格式', trigger: 'blur' }
        ],
        version: [
          { max: 50, message: '长度不能超过 50 个字符', trigger: 'blur' }
        ],
        platform: [
          { max: 100, message: '长度不能超过 100 个字符', trigger: 'blur' }
        ]
      }
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
  methods: {
    ...mapActions('clientManagement', ['registerClient']),

    // 提交表单
    async handleSubmit() {
      try {
        // 表单验证
        await this.$refs.registerForm.validate()

        this.submitting = true

        // 提交注册
        const response = await this.registerClient(this.form)

        if (response.code === 20000) {
          this.$message.success('客户端注册成功')
          this.$emit('refresh')
          this.handleClose()
        } else {
          this.$message.error(response.message || '注册失败')
        }
      } catch (error) {
        if (error !== false) { // 不是表单验证错误
          console.error('注册客户端失败:', error)

          // 处理具体错误信息
          let errorMessage = '注册失败'
          if (error.response && error.response.data) {
            const { data } = error.response
            if (data.detail) {
              if (typeof data.detail === 'string') {
                errorMessage = data.detail
              } else if (Array.isArray(data.detail)) {
                errorMessage = data.detail.map(item => item.msg || item.message || item).join('; ')
              }
            } else if (data.message) {
              errorMessage = data.message
            }
          }

          this.$message.error(errorMessage)
        }
      } finally {
        this.submitting = false
      }
    },

    // 关闭对话框
    handleClose() {
      this.dialogVisible = false
      this.resetForm()
    },

    // 重置表单
    resetForm() {
      this.$refs.registerForm && this.$refs.registerForm.resetFields()
      this.form = {
        client_id: '',
        hostname: '',
        ip_address: '',
        version: '',
        platform: ''
      }
      this.submitting = false
    },

    // 自动生成客户端ID
    generateClientId() {
      const timestamp = Date.now().toString().slice(-6)
      const random = Math.random().toString(36).substring(2, 5)
      return `rpa_client_${timestamp}_${random}`
    },

    // 获取本机信息（如果可能）
    async getLocalInfo() {
      try {
        // 尝试获取主机名（浏览器环境下受限）
        if (navigator && navigator.userAgent) {
          const ua = navigator.userAgent
          let platform = 'Unknown'

          if (ua.includes('Windows NT 10.0')) {
            platform = 'Windows 10'
          } else if (ua.includes('Windows NT 6.3')) {
            platform = 'Windows 8.1'
          } else if (ua.includes('Windows NT 6.1')) {
            platform = 'Windows 7'
          } else if (ua.includes('Mac OS X')) {
            platform = 'macOS'
          } else if (ua.includes('Linux')) {
            platform = 'Linux'
          }

          this.form.platform = platform
        }

        // 自动生成客户端ID
        if (!this.form.client_id) {
          this.form.client_id = this.generateClientId()
        }
      } catch (error) {
        console.log('无法获取本机信息:', error)
      }
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.$nextTick(() => {
          this.getLocalInfo()
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.register-info {
  margin-top: 20px;

  .info-title {
    font-weight: bold;
    margin-bottom: 8px;
  }

  .info-list {
    margin: 0;
    padding-left: 20px;

    li {
      margin-bottom: 4px;
      font-size: 13px;
      line-height: 1.5;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.dialog-footer {
  text-align: right;
}

// 表单样式优化
::v-deep .el-form {
  .el-form-item__label {
    font-weight: 500;
  }

  .el-input__inner,
  .el-select .el-input__inner {
    border-radius: 4px;
  }

  .el-form-item__error {
    font-size: 12px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  ::v-deep .el-dialog {
    width: 95% !important;
    margin-top: 20px !important;
  }

  ::v-deep .el-form {
    .el-form-item {
      margin-bottom: 18px;
    }

    .el-form-item__label {
      line-height: 1.4;
    }
  }
}
</style>
