import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Button } from 'antd'
import { ArrowLeftOutlined, LogoutOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

const { Header, Content } = Layout

function ParentLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [studentInfo, setStudentInfo] = useState(null)

  useEffect(() => {
    const info = localStorage.getItem('parentAccess')
    if (info) {
      setStudentInfo(JSON.parse(info))
    }
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('parentAccess')
    setStudentInfo(null)
    navigate('/parent')
  }

  const showHeader = location.pathname !== '/parent' && studentInfo

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {showHeader && (
        <Header style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {location.pathname !== '/parent/portfolio' && (
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate(-1)}
                style={{ color: '#fff' }}
              >
                返回
              </Button>
            )}
            <h2 style={{ color: '#fff', margin: 0, fontSize: 18 }}>
              🎨 {studentInfo.student_name} 的作品集
            </h2>
          </div>
          <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            style={{ color: '#fff' }}
          >
            退出
          </Button>
        </Header>
      )}
      <Content>
        <Outlet />
      </Content>
    </Layout>
  )
}

export default ParentLayout
