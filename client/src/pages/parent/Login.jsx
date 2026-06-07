import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input, Button, message, Card } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { accessAPI } from '../../services/api'

function ParentLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const codeFromUrl = searchParams.get('code')
    if (codeFromUrl) {
      setCode(codeFromUrl.toUpperCase())
      verifyCode(codeFromUrl.toUpperCase())
    }

    const savedAccess = localStorage.getItem('parentAccess')
    if (savedAccess && !codeFromUrl) {
      navigate('/parent/portfolio')
    }
  }, [])

  const verifyCode = async (accessCode) => {
    if (!accessCode.trim()) {
      message.warning('请输入访问码')
      return
    }
    setLoading(true)
    try {
      const data = await accessAPI.verify(accessCode.trim().toUpperCase())
      localStorage.setItem('parentAccess', JSON.stringify(data))
      message.success(`欢迎，${data.student_name}家长`)
      navigate('/parent/portfolio')
    } catch (err) {
      message.error(err.response?.data?.error || '访问码无效')
    }
    setLoading(false)
  }

  const handleSubmit = () => {
    verifyCode(code)
  }

  return (
    <div className="access-login">
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
      <h1 style={{ marginBottom: 8 }}>学生作品集</h1>
      <p style={{ color: '#999', marginBottom: 32 }}>请输入您的专属访问码</p>
      
      <Input
        size="large"
        placeholder="请输入访问码"
        prefix={<LockOutlined />}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onPressEnter={handleSubmit}
        style={{ marginBottom: 16, textAlign: 'center', fontSize: 18, letterSpacing: 4 }}
        maxLength={16}
      />
      
      <Button
        type="primary"
        size="large"
        block
        onClick={handleSubmit}
        loading={loading}
      >
        进入作品集
      </Button>

      <p style={{ marginTop: 24, fontSize: 12, color: '#ccc' }}>
        如有问题请联系孩子的美术老师
      </p>
    </div>
  )
}

export default ParentLogin
