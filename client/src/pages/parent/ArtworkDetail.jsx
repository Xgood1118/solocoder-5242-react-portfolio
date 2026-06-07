import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Tag, Button, message, Space, Descriptions, Divider,
} from 'antd'
import { HeartOutlined, HeartFilled, LeftOutlined, TrophyOutlined } from '@ant-design/icons'
import { artworksAPI } from '../../services/api'

function ArtworkDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [artwork, setArtwork] = useState(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [studentInfo, setStudentInfo] = useState(null)

  useEffect(() => {
    const info = localStorage.getItem('parentAccess')
    if (!info) {
      navigate('/parent')
      return
    }
    setStudentInfo(JSON.parse(info))
    loadArtwork()
  }, [id])

  const loadArtwork = async () => {
    try {
      const data = await artworksAPI.get(id)
      setArtwork(data)
      
      const likesData = await artworksAPI.getLikes(id)
      setLikeCount(likesData.count)

      const info = localStorage.getItem('parentAccess')
      if (info) {
        const accessInfo = JSON.parse(info)
        const myLikes = await artworksAPI.getMyLikes(accessInfo.access_code_id)
        setLiked(myLikes.includes(parseInt(id)))
      }
    } catch (err) {
      message.error('加载失败')
    }
  }

  const handleLike = async () => {
    if (!studentInfo) return
    try {
      const result = await artworksAPI.like(id, studentInfo.access_code_id)
      setLiked(result.liked)
      setLikeCount(prev => result.liked ? prev + 1 : prev - 1)
    } catch (err) {
      message.error('操作失败')
    }
  }

  if (!artwork) {
    return <div style={{ padding: 24 }}>加载中...</div>
  }

  const renderMedia = () => {
    if (artwork.file_type === 'image') {
      return (
        <div style={{ textAlign: 'center', background: '#f5f5f5', padding: 24, borderRadius: 8 }}>
          <img
            src={artwork.file_path}
            alt={artwork.title || '作品'}
            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }}
          />
        </div>
      )
    }
    if (artwork.file_type === 'video') {
      return (
        <div style={{ textAlign: 'center' }}>
          <video
            src={artwork.file_path}
            controls
            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }}
          />
        </div>
      )
    }
    if (artwork.file_type === 'pdf') {
      return (
        <iframe
          src={artwork.file_path}
          style={{ width: '100%', height: '70vh', border: '1px solid #ddd', borderRadius: 8 }}
          title="PDF Preview"
        />
      )
    }
    return null
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Card>
        <Space style={{ marginBottom: 16 }} size="large" wrap>
          <h2 style={{ margin: 0 }}>{artwork.title || artwork.original_name || '作品'}</h2>
          {artwork.grade && (
            <span className={`grade-badge grade-${artwork.grade}`} style={{ fontSize: 14, padding: '4px 12px' }}>
              {artwork.grade}
            </span>
          )}
          {artwork.is_final_excellent && (
            <Tag color="gold" icon={<TrophyOutlined />}>期末优秀</Tag>
          )}
        </Space>

        {renderMedia()}

        <Divider />

        <Space style={{ marginBottom: 16 }} wrap size="large">
          <Button
            type="primary"
            shape="round"
            icon={liked ? <HeartFilled /> : <HeartOutlined />}
            onClick={handleLike}
            danger={liked}
          >
            {liked ? '已点赞' : '点赞'} ({likeCount})
          </Button>
        </Space>

        <Descriptions column={2} bordered size="middle">
          <Descriptions.Item label="创作日期" span={1}>
            {artwork.created_date || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="材料" span={1}>
            {artwork.materials || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="标签" span={2}>
            <Space wrap>
              {artwork.tags?.filter(t => !t.is_internal).map(tag => (
                <Tag key={tag.id}>{tag.name}</Tag>
              ))}
              {artwork.tags?.filter(t => !t.is_internal).length === 0 && '-'}
            </Space>
          </Descriptions.Item>
          {artwork.comment && (
            <Descriptions.Item label="老师评语" span={2}>
              <p style={{ margin: 0, lineHeight: 1.8 }}>{artwork.comment}</p>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  )
}

export default ArtworkDetail
