import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Badge } from 'antd'
import {
  UserOutlined,
  PictureOutlined,
  InboxOutlined,
  MessageOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { studentsAPI, artworksAPI, messagesAPI } from '../../services/api'

function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    artworks: 0,
    pending: 0,
    messages: 0,
    excellent: 0,
  })
  const [recentArtworks, setRecentArtworks] = useState([])
  const [recentMessages, setRecentMessages] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [students, artworks, pending, messages] = await Promise.all([
        studentsAPI.list(),
        artworksAPI.list(),
        artworksAPI.list({ pending: 'true' }),
        messagesAPI.byStudent(),
      ])

      const unreadCount = messages.reduce((sum, m) => sum + m.unread_count, 0)
      const excellentCount = artworks.filter(a => a.is_final_excellent).length

      setStats({
        students: students.length,
        artworks: artworks.length,
        pending: pending.length,
        messages: unreadCount,
        excellent: excellentCount,
      })

      setRecentArtworks(artworks.slice(0, 5))
      setRecentMessages(messages.slice(0, 5))
    } catch (err) {
      console.error('加载数据失败', err)
    }
  }

  const artworkColumns = [
    { title: '作品', dataIndex: 'file_name', key: 'file_name' },
    {
      title: '学生',
      dataIndex: ['student', 'name'],
      key: 'student',
      render: (name) => name || <Tag color="orange">待整理</Tag>,
    },
    { title: '学期', dataIndex: 'semester', key: 'semester' },
    {
      title: '评分',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade) => grade ? <Tag color={grade === 'A' ? 'green' : grade === 'B' ? 'blue' : grade === 'C' ? 'gold' : 'red'}>{grade}</Tag> : '-',
    },
    {
      title: '期末优秀',
      dataIndex: 'is_final_excellent',
      key: 'is_final_excellent',
      render: (v) => v ? <Badge status="success" text="是" /> : '-',
    },
  ]

  const messageColumns = [
    { title: '学生', dataIndex: ['student', 'name'], key: 'student' },
    { title: '班级', dataIndex: ['student', 'class_name'], key: 'class' },
    {
      title: '未读留言',
      dataIndex: 'unread_count',
      key: 'unread_count',
      render: (count) => count > 0 ? <Badge count={count} /> : '0',
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="学生总数"
              value={stats.students}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="作品总数"
              value={stats.artworks}
              prefix={<PictureOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待整理作品"
              value={stats.pending}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="未读留言"
              value={stats.messages}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title="最近作品" extra={<Tag icon={<TrophyOutlined />} color="gold">期末优秀: {stats.excellent}</Tag>}>
            <Table
              dataSource={recentArtworks}
              columns={artworkColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="家长留言动态">
            <Table
              dataSource={recentMessages}
              columns={messageColumns}
              rowKey={(r) => r.student.id}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
