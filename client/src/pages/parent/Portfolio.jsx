import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Tag, Button, Modal, Input, Select, Row, Col,
  Empty, message, Drawer, Badge, Space, Divider, List,
} from 'antd'
import {
  HeartOutlined, HeartFilled, MessageOutlined,
  FilterOutlined, TrophyOutlined, SendOutlined,
} from '@ant-design/icons'
import { studentsAPI, tagsAPI, artworksAPI, messagesAPI, semestersAPI } from '../../services/api'

const { TextArea } = Input

function ParentPortfolio() {
  const navigate = useNavigate()
  const [studentInfo, setStudentInfo] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [semesters, setSemesters] = useState([])
  const [currentSemester, setCurrentSemester] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [tags, setTags] = useState([])
  const [tagCategories, setTagCategories] = useState([])
  const [selectedTagIds, setSelectedTagIds] = useState([])
  const [likedIds, setLikedIds] = useState([])
  const [filterVisible, setFilterVisible] = useState(false)
  const [messageModalVisible, setMessageModalVisible] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [viewMessagesVisible, setViewMessagesVisible] = useState(false)
  const [myMessages, setMyMessages] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const info = localStorage.getItem('parentAccess')
    if (!info) {
      navigate('/parent')
      return
    }
    setStudentInfo(JSON.parse(info))
    loadInitialData()
  }, [])

  useEffect(() => {
    if (studentInfo && selectedSemester) {
      loadArtworks()
      loadLikes()
    }
  }, [selectedSemester, selectedTagIds, studentInfo])

  const loadInitialData = async () => {
    try {
      const [semesterData, tagData, categoryData] = await Promise.all([
        semestersAPI.list(),
        tagsAPI.list({ internal: 'false' }),
        tagsAPI.categories(),
      ])
      setSemesters(semesterData)
      setTags(tagData)
      setTagCategories(categoryData)
      const current = semesterData.find(s => s.is_current)
      if (current) {
        setCurrentSemester(current.name)
        setSelectedSemester(current.name)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadArtworks = async () => {
    if (!studentInfo) return
    setLoading(true)
    try {
      const data = await studentsAPI.getArtworks(studentInfo.student_id, selectedSemester)
      const visible = data.filter(a => !a.is_hidden && !a.pending_student)
      
      if (selectedTagIds.length > 0) {
        setArtworks(visible.filter(a => 
          selectedTagIds.some(tid => a.tags?.some(t => t.id === tid))
        ))
      } else {
        setArtworks(visible)
      }
    } catch (err) {
      message.error('加载作品失败')
    }
    setLoading(false)
  }

  const loadLikes = async () => {
    if (!studentInfo) return
    try {
      const ids = await artworksAPI.getMyLikes(studentInfo.access_code_id)
      setLikedIds(ids)
    } catch (err) {
      console.error(err)
    }
  }

  const handleLike = async (artworkId) => {
    if (!studentInfo) return
    try {
      const result = await artworksAPI.like(artworkId, studentInfo.access_code_id)
      if (result.liked) {
        setLikedIds(prev => [...prev, artworkId])
      } else {
        setLikedIds(prev => prev.filter(id => id !== artworkId))
      }
    } catch (err) {
      message.error('操作失败')
    }
  }

  const handleViewDetail = (artwork) => {
    navigate(`/parent/artwork/${artwork.id}`)
  }

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      message.warning('请输入留言内容')
      return
    }
    try {
      await messagesAPI.create({
        student_id: studentInfo.student_id,
        access_code_id: studentInfo.access_code_id,
        content: messageText.trim(),
        parent_name: studentInfo.parent_name || '家长',
      })
      message.success('留言发送成功')
      setMessageText('')
      setMessageModalVisible(false)
    } catch (err) {
      message.error('发送失败')
    }
  }

  const handleViewMessages = async () => {
    if (!studentInfo) return
    try {
      const data = await messagesAPI.list({ student_id: studentInfo.student_id })
      setMyMessages(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
    } catch (err) {
      message.error('加载失败')
    }
    setViewMessagesVisible(true)
  }

  const finalExcellent = artworks.filter(a => a.is_final_excellent)
  const regular = artworks.filter(a => !a.is_final_excellent)

  const renderArtworkCard = (artwork) => {
    const isLiked = likedIds.includes(artwork.id)

    return (
      <Card
        key={artwork.id}
        hoverable
        onClick={() => handleViewDetail(artwork)}
        cover={
          artwork.file_type === 'image' ? (
            <div style={{ height: 200, overflow: 'hidden' }}>
              <img
                alt={artwork.title || '作品'}
                src={artwork.file_path}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : artwork.file_type === 'video' ? (
            <div style={{ height: 200, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 40 }}>
              ▶️
            </div>
          ) : artwork.file_type === 'pdf' ? (
            <div style={{ height: 200, background: '#ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>
              PDF 文档
            </div>
          ) : null
        }
        styles={{ body: { padding: 12 } }}
      >
        <Card.Meta
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>{artwork.title || '作品'}</span>
              {artwork.grade && (
                <span className={`grade-badge grade-${artwork.grade}`}>{artwork.grade}</span>
              )}
            </div>
          }
          description={
            <div>
              {artwork.tags?.slice(0, 3).map(tag => (
                <Tag key={tag.id} style={{ margin: 2 }} size="small">{tag.name}</Tag>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ color: '#999', fontSize: 12 }}>
                  {artwork.created_date || ''}
                </span>
                <Button
                  type="text"
                  icon={isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLike(artwork.id)
                  }}
                  size="small"
                />
              </div>
            </div>
          }
        />
      </Card>
    )
  }

  if (!studentInfo) return null

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <h2 style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
              🎨 {studentInfo.student_name} 的作品集
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              {studentInfo.class_name || ''} | 共 {artworks.length} 件作品
            </p>
          </Col>
          <Col>
            <Space>
              <Button icon={<MessageOutlined />} onClick={handleViewMessages}>
                我的留言
              </Button>
              <Button type="primary" icon={<MessageOutlined />} onClick={() => setMessageModalVisible(true)}>
                给老师留言
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <span>学期：</span>
              <Select
                value={selectedSemester}
                onChange={(val) => {
                  setSelectedSemester(val)
                  setSelectedTagIds([])
                }}
                style={{ width: 200 }}
                options={semesters.map(s => ({ 
                  value: s.name, 
                  label: s.name + (s.is_current ? ' (当前)' : '') 
                }))}
              />
            </Space>
          </Col>
          <Col>
            <Button icon={<FilterOutlined />} onClick={() => setFilterVisible(true)}>
              标签筛选
              {selectedTagIds.length > 0 && <Badge count={selectedTagIds.length} style={{ marginLeft: 8 }} />}
            </Button>
          </Col>
        </Row>
      </Card>

      {finalExcellent.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>
            <TrophyOutlined style={{ color: '#faad14' }} /> 期末优秀作品
            <Tag color="gold" style={{ marginLeft: 8 }}>{finalExcellent.length} 件</Tag>
          </h3>
          <Row gutter={[16, 16]}>
            {finalExcellent.map(artwork => (
              <Col xs={24} sm={12} md={8} lg={6} key={artwork.id}>
                {renderArtworkCard(artwork)}
              </Col>
            ))}
          </Row>
        </div>
      )}

      {regular.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 16 }}>
            学期作品
            <Tag style={{ marginLeft: 8 }}>{regular.length} 件</Tag>
          </h3>
          <Row gutter={[16, 16]}>
            {regular.map(artwork => (
              <Col xs={24} sm={12} md={8} lg={6} key={artwork.id}>
                {renderArtworkCard(artwork)}
              </Col>
            ))}
          </Row>
        </div>
      )}

      {artworks.length === 0 && !loading && (
        <Empty description="暂无作品" style={{ marginTop: 60 }} />
      )}

      <Drawer
        title="标签筛选"
        placement="right"
        open={filterVisible}
        onClose={() => setFilterVisible(false)}
        width={280}
      >
        {tagCategories.map(cat => {
          const publicTags = tags.filter(t => t.category === cat.category && !t.is_internal)
          if (publicTags.length === 0) return null
          return (
            <div key={cat.category} style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 12 }}>{cat.category}</h4>
              <Space wrap size={[8, 8]}>
                {publicTags.map(tag => {
                  const selected = selectedTagIds.includes(tag.id)
                  return (
                    <Tag
                      key={tag.id}
                      color={selected ? 'blue' : 'default'}
                      style={{ cursor: 'pointer', padding: '4px 12px' }}
                      onClick={() => {
                        if (selected) {
                          setSelectedTagIds(prev => prev.filter(id => id !== tag.id))
                        } else {
                          setSelectedTagIds(prev => [...prev, tag.id])
                        }
                      }}
                    >
                      {tag.name}
                    </Tag>
                  )
                })}
              </Space>
            </div>
          )
        })}
        <Divider />
        <Button block onClick={() => setSelectedTagIds([])}>
          清除全部筛选
        </Button>
      </Drawer>

      <Modal
        title="给老师留言"
        open={messageModalVisible}
        onCancel={() => setMessageModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setMessageModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" icon={<SendOutlined />} onClick={handleSendMessage}>
            发送
          </Button>,
        ]}
      >
        <TextArea
          rows={4}
          placeholder="请输入您的留言..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          maxLength={500}
          showCount
        />
        <p style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
          老师看到留言后会尽快回复您
        </p>
      </Modal>

      <Drawer
        title="我的留言"
        placement="right"
        open={viewMessagesVisible}
        onClose={() => setViewMessagesVisible(false)}
        width={400}
      >
        <List
          dataSource={myMessages}
          locale={{ emptyText: '暂无留言' }}
          renderItem={msg => (
            <List.Item key={msg.id}>
              <div style={{ width: '100%' }}>
                <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>
                  {msg.created_at}
                  {msg.is_replied ? (
                    <Tag color="green" style={{ marginLeft: 8 }}>已回复</Tag>
                  ) : (
                    <Tag color="orange" style={{ marginLeft: 8 }}>等待回复</Tag>
                  )}
                </div>
                <div className="message-bubble">{msg.content}</div>
                {msg.reply && (
                  <div className="message-bubble reply">
                    <div style={{ color: '#1890ff', fontWeight: 'bold', marginBottom: 4 }}>
                      老师回复
                    </div>
                    {msg.reply}
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
        {myMessages.length > 0 && !myMessages[0]?.is_replied && (
          <Button
            type="primary"
            block
            icon={<MessageOutlined />}
            onClick={() => {
              setViewMessagesVisible(false)
              setMessageModalVisible(true)
            }}
            style={{ marginTop: 16 }}
          >
            追加留言
          </Button>
        )}
      </Drawer>
    </div>
  )
}

export default ParentPortfolio
