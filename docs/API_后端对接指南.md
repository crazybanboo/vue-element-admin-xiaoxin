# Vue Element Admin - API 后端对接指南

本文档详细说明如何在 Vue Element Admin 项目中与后端 API 进行对接。

## 项目架构概览

### 核心技术栈
- **前端框架**: Vue 2.6.10 + Vue Router 3.0.2 + Vuex 3.1.0
- **UI 组件库**: Element UI 2.13.2
- **HTTP 客户端**: Axios 0.18.1
- **构建工具**: Vue CLI 4.4.4

### 目录结构
```
src/
├── api/              # API 接口定义
├── utils/            # 工具函数（包含请求配置）
├── store/            # Vuex 状态管理
└── views/            # 页面组件
```

## API 对接核心配置

### 1. 请求配置 (`src/utils/request.js`)

#### 基础配置
```javascript
import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'

const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,  // 后端 API 基础地址
  timeout: 5000                           // 请求超时时间
})
```

#### 请求拦截器
- **Token 注入**: 自动在请求头中添加 `X-Token`
- **权限验证**: 检查用户登录状态
```javascript
service.interceptors.request.use(config => {
  if (store.getters.token) {
    config.headers['X-Token'] = getToken()
  }
  return config
})
```

#### 响应拦截器
- **统一错误处理**: 根据响应码处理业务逻辑
- **Token 过期处理**: 自动跳转登录页面
- **消息提示**: 统一显示错误信息

```javascript
service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 20000) {
      // 错误处理逻辑
      Message({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })
      
      // Token 相关错误码处理
      if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
        // 重新登录逻辑
      }
    }
    return res
  }
)
```

### 2. 环境变量配置

在项目根目录创建环境配置文件：

#### `.env.development` (开发环境)
```bash
VUE_APP_BASE_API = 'http://localhost:3000/api'
```

#### `.env.production` (生产环境)
```bash
VUE_APP_BASE_API = 'https://your-production-api.com/api'
```

## API 接口模块化设计

### 1. 用户相关 API (`src/api/user.js`)

```javascript
import request from '@/utils/request'

// 用户登录
export function login(data) {
  return request({
    url: '/vue-element-admin/user/login',
    method: 'post',
    data
  })
}

// 获取用户信息
export function getInfo(token) {
  return request({
    url: '/vue-element-admin/user/info',
    method: 'get',
    params: { token }
  })
}

// 用户登出
export function logout() {
  return request({
    url: '/vue-element-admin/user/logout',
    method: 'post'
  })
}
```

### 2. 文章管理 API (`src/api/article.js`)

```javascript
import request from '@/utils/request'

// 获取文章列表
export function fetchList(query) {
  return request({
    url: '/vue-element-admin/article/list',
    method: 'get',
    params: query
  })
}

// 获取文章详情
export function fetchArticle(id) {
  return request({
    url: '/vue-element-admin/article/detail',
    method: 'get',
    params: { id }
  })
}

// 创建文章
export function createArticle(data) {
  return request({
    url: '/vue-element-admin/article/create',
    method: 'post',
    data
  })
}

// 更新文章
export function updateArticle(data) {
  return request({
    url: '/vue-element-admin/article/update',
    method: 'post',
    data
  })
}
```

## 后端 API 规范要求

### 1. 响应数据格式

后端 API 必须返回统一的数据格式：

```javascript
// 成功响应
{
  "code": 20000,        // 业务状态码
  "data": {},           // 实际数据
  "message": "success"  // 响应消息
}

// 错误响应
{
  "code": 50000,        // 错误码
  "data": null,
  "message": "错误信息"
}
```

### 2. 认证相关错误码

系统预定义的认证错误码：
- `50008`: 非法 Token
- `50012`: 其他客户端登录
- `50014`: Token 过期

### 3. HTTP 状态码约定

- `200`: 请求成功
- `401`: 未授权访问
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 实际使用示例

### 1. 在 Vue 组件中调用 API

```vue
<template>
  <div>
    <el-button @click="handleLogin">登录</el-button>
  </div>
</template>

<script>
import { login } from '@/api/user'

export default {
  methods: {
    async handleLogin() {
      try {
        const response = await login({
          username: 'admin',
          password: '123456'
        })
        
        // 处理登录成功逻辑
        this.$store.dispatch('user/setToken', response.data.token)
        this.$router.push('/dashboard')
        
      } catch (error) {
        // 错误处理已在 request.js 中统一处理
        console.error('登录失败:', error)
      }
    }
  }
}
</script>
```

### 2. 结合 Vuex 状态管理

```javascript
// store/modules/user.js
import { login, logout, getInfo } from '@/api/user'

const actions = {
  async login({ commit }, userInfo) {
    const { username, password } = userInfo
    const response = await login({ username: username.trim(), password })
    const { data } = response
    commit('SET_TOKEN', data.token)
    setToken(data.token)
    return data
  },
  
  async getInfo({ commit, state }) {
    const response = await getInfo(state.token)
    const { data } = response
    commit('SET_NAME', data.name)
    commit('SET_AVATAR', data.avatar)
    return data
  }
}
```

## 开发调试技巧

### 1. Mock 数据开发

项目内置 Mock 功能，位于 `mock/` 目录：

```javascript
// mock/user.js
export default [
  {
    url: '/vue-element-admin/user/login',
    type: 'post',
    response: config => {
      return {
        code: 20000,
        data: {
          token: 'admin-token'
        }
      }
    }
  }
]
```

### 2. 网络请求监控

在浏览器开发者工具 Network 面板中：
- 检查请求 URL 是否正确
- 验证请求头中的 Token
- 查看响应数据格式
- 分析错误响应内容

### 3. 错误处理调试

在 `request.js` 中添加调试日志：

```javascript
service.interceptors.response.use(
  response => {
    console.log('API Response:', response.data)
    return response.data
  },
  error => {
    console.error('API Error:', error.response)
    return Promise.reject(error)
  }
)
```

## 部署注意事项

### 1. 跨域问题处理

#### 开发环境 (`vue.config.js`)
```javascript
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
}
```

#### 生产环境
- 后端设置 CORS 头
- 或使用 Nginx 反向代理

### 2. 构建配置

确保生产环境的 API 地址正确配置在 `.env.production` 文件中。

## 最佳实践

### 1. API 模块组织
- 按业务模块划分 API 文件
- 使用语义化的函数命名
- 统一的参数传递方式

### 2. 错误处理
- 在 request.js 中统一处理通用错误
- 在组件中处理特定业务错误
- 提供用户友好的错误提示

### 3. 性能优化
- 合理设置请求超时时间
- 避免重复请求
- 使用请求取消机制

### 4. 安全考虑
- Token 存储安全
- 敏感信息不在前端暴露
- 请求参数验证

---

## 技术支持

如需更多技术支持，请参考：
- [Vue Element Admin 官方文档](https://panjiachen.github.io/vue-element-admin-site/)
- [Axios 官方文档](https://axios-http.com/)
- [Element UI 官方文档](https://element.eleme.io/)