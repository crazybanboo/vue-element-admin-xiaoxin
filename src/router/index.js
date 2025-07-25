import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/* Router Modules - 已注释掉不需要的模块
import componentsRouter from './modules/components'
import chartsRouter from './modules/charts'
import tableRouter from './modules/table'
import nestedRouter from './modules/nested'
*/

/**
 * Route Configuration Documentation
 * Detail: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * Route Visibility Control:
 * hidden: true                   Hide from sidebar navigation (system/utility routes)
 * alwaysShow: true              Always show root menu regardless of children count
 * redirect: noRedirect          Disable breadcrumb redirection
 *
 * Route Identification:
 * name: 'RouterName'            Required for <keep-alive>, use PascalCase
 * path: '/path'                 Use kebab-case for consistency
 *
 * Meta Properties:
 * roles: ['admin','editor']     Role-based access control
 * title: 'Display Name'        Sidebar and breadcrumb label
 * icon: 'icon-name'            Sidebar icon (svg-name or el-icon-x)
 * noCache: true                Disable route caching
 * affix: true                  Pin tab in tags-view
 * breadcrumb: false            Hide from breadcrumb navigation
 * activeMenu: '/target/path'   Highlight specific menu item
 *
 * Hidden Route Categories:
 * - System utilities: /redirect, /auth-redirect
 * - Authentication: /login, /logout
 * - Error pages: /404, /401 (when accessed directly)
 * - Dynamic routes: /edit/:id, /detail/:id
 * - File operations: /download, /export
 * - User-specific: /profile, /settings
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/auth-redirect',
    component: () => import('@/views/login/auth-redirect'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error-page/401'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index'),
        name: 'Dashboard',
        meta: { title: 'Dashboard', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/profile',
    component: Layout,
    redirect: '/profile/index',
    hidden: true, // Hidden from sidebar - accessed via user menu
    children: [
      {
        path: 'index',
        component: () => import('@/views/profile/index'),
        name: 'Profile',
        meta: { title: 'Profile', icon: 'user', noCache: true }
      }
    ]
  }
]

/**
 * asyncRoutes
 * the routes that need to be dynamically loaded based on user roles
 * 简化版：只保留示例页面，其他页面都已隐藏
 */
export const asyncRoutes = [
  {
    path: '/example',
    component: Layout,
    redirect: '/example/list',
    name: 'Example',
    meta: {
      title: 'Example',
      icon: 'el-icon-s-help'
    },
    children: [
      {
        path: 'create',
        component: () => import('@/views/example/create'),
        name: 'CreateArticle',
        meta: { title: 'Create Article', icon: 'edit' }
      },
      {
        path: 'edit/:id(\\d+)',
        component: () => import('@/views/example/edit'),
        name: 'EditArticle',
        meta: { title: 'Edit Article', noCache: true, activeMenu: '/example/list' },
        hidden: true // Hidden dynamic route - accessed via edit actions
      },
      {
        path: 'list',
        component: () => import('@/views/example/list'),
        name: 'ArticleList',
        meta: { title: 'Article List', icon: 'list' }
      }
    ]
  },

  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true } // Hidden fallback route
]

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
