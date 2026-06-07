import { Layout, Menu } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  DashboardOutlined,
  UserOutlined,
  PictureOutlined,
  UploadOutlined,
  TagsOutlined,
  MessageOutlined,
  InboxOutlined,
} from '@ant-design/icons'

const { Sider, Content } = Layout

function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: '概览' },
    { key: '/admin/students', icon: <UserOutlined />, label: '学生管理' },
    { key: '/admin/artworks', icon: <PictureOutlined />, label: '作品管理' },
    { key: '/admin/upload', icon: <UploadOutlined />, label: '批量上传' },
    { key: '/admin/pending', icon: <InboxOutlined />, label: '待整理' },
    { key: '/admin/tags', icon: <TagsOutlined />, label: '标签管理' },
    { key: '/admin/messages', icon: <MessageOutlined />, label: '家长留言' },
  ]

  const getSelectedKey = () => {
    const path = location.pathname
    if (path === '/admin') return '/admin'
    const item = menuItems.find(m => path.startsWith(m.key) && m.key !== '/admin')
    return item ? item.key : '/admin'
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div className="sidebar-logo">🎨 作品集管理</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
