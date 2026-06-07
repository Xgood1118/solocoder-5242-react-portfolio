import { useState, useEffect } from 'react'
import {
  Card, List, Avatar, Input, Button, Badge, Space, Tag,
  Collapse, message,
} from 'antd'
import { UserOutlined, SendOutlined } from '@ant-design/icons'
import { messagesAPI, studentsAPI } from '../../services/api'

const { TextArea } = Input
const { Panel } = Collapse

function Messages() {
  const [groupedMessages, setGroupedMessages] = useState([])
  const [replyText, setReplyText] = useState({})
  const [loading, setLoading] = useState(false)
  const [activeKey, setActiveKey] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await messagesAPI.byStudent()
      setGroupedMessages(data.sort((a, b) => b.unread_count - a.unread_count))
    } catch (err) {
      message.error('加载失败')
    }
    setLoading(false)
  }

  const handleReply = async (messageId) => {
    const reply = replyText[messageId]
    if (!reply?.trim()) {
      message.warning('请输入回复内容')
      return
    }
    try {
      await messagesAPI.reply(messageId, reply.trim())
      message.success('回复成功')
      setReplyText(prev => ({ ...prev, [messageId]: '' }))
      loadData()
    } catch (err) {
      message.error('回复失败')
    }
  }

  const hasUnread = (messages) => messages.some(m => !m.is_replied)

  return (
    <Card
      title={
        <Space>
          家长留言
          <Badge
            count={groupedMessages.reduce((sum, g) => sum + g.unread_count, 0)}
            showZero
          />
        </Space>
      }
      loading={loading}
    >
      {groupedMessages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
          暂无家长留言
        </div>
      ) : (
        <Collapse
          activeKey={activeKey}
          onChange={setActiveKey}
          accordion
        >
          {groupedMessages.map(group => (
            <Panel
              key={group.student.id}
              header={
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <span>{group.student.name}</span>
                  <Tag>{group.student.class_name}</Tag>
                  {group.unread_count > 0 && (
                    <Badge count={group.unread_count} />
                  )}
                </Space>
              }
              extra={
                <span style={{ color: '#999', fontSize: 12 }}>
                  {group.messages.length} 条留言
                </span>
              }
            >
              <List
                dataSource={group.messages.sort((a, b) => 
                  new Date(a.created_at) - new Date(b.created_at)
                )}
                renderItem={msg => (
                  <List.Item key={msg.id}>
                    <div style={{ width: '100%' }}>
                      <div style={{ marginBottom: 8 }}>
                        <Space>
                          <span style={{ fontWeight: 'bold' }}>
                            {msg.parent_name || '家长'}
                          </span>
                          <span style={{ color: '#999', fontSize: 12 }}>
                            {msg.created_at}
                          </span>
                          {!msg.is_replied && <Tag color="red">未回复</Tag>}
                        </Space>
                      </div>
                      <div className="message-bubble">
                        {msg.content}
                      </div>
                      {msg.reply && (
                        <div className="message-bubble reply">
                          <div style={{ color: '#1890ff', fontWeight: 'bold', marginBottom: 4 }}>
                            老师回复
                          </div>
                          {msg.reply}
                        </div>
                      )}
                      {!msg.is_replied && (
                        <div style={{ marginTop: 12 }}>
                          <Space.Compact style={{ width: '100%' }}>
                            <TextArea
                              rows={2}
                              placeholder="输入回复..."
                              value={replyText[msg.id] || ''}
                              onChange={(e) => setReplyText(prev => ({
                                ...prev,
                                [msg.id]: e.target.value,
                              }))}
                            />
                            <Button
                              type="primary"
                              icon={<SendOutlined />}
                              onClick={() => handleReply(msg.id)}
                            >
                              回复
                            </Button>
                          </Space.Compact>
                        </div>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </Panel>
          ))}
        </Collapse>
      )}
    </Card>
  )
}

export default Messages
