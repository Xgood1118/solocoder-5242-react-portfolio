import { useState, useEffect, useRef } from 'react'
import { Card, Select, Progress, Button, List, Tag, message, Space, Divider } from 'antd'
import { UploadOutlined, InboxOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { uploadAPI, semestersAPI, artworksAPI } from '../../services/api'

function Upload() {
  const [semester, setSemester] = useState('')
  const [semesters, setSemesters] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadItems, setUploadItems] = useState([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)
  const concurrency = 5

  useEffect(() => {
    loadSemesters()
  }, [])

  const loadSemesters = async () => {
    try {
      const data = await semestersAPI.list()
      setSemesters(data)
      const current = data.find(s => s.is_current)
      if (current) setSemester(current.name)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    addFiles(files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const addFiles = (files) => {
    if (!semester) {
      message.warning('请先选择学期')
      return
    }
    const newItems = files.map((file, index) => ({
      id: Date.now() + index,
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending',
      error: null,
      result: null,
    }))
    setUploadItems(prev => [...prev, ...newItems])
  }

  const startUpload = async () => {
    if (!semester) {
      message.warning('请先选择学期')
      return
    }
    if (uploadItems.length === 0) {
      message.warning('请先选择要上传的文件')
      return
    }

    setUploading(true)
    const pendingItems = uploadItems.filter(i => i.status === 'pending' || i.status === 'error')
    let index = 0

    const uploadNext = async () => {
      if (index >= pendingItems.length) {
        setUploading(false)
        const successCount = uploadItems.filter(i => i.status === 'success').length
        message.success(`上传完成，成功 ${successCount} 个`)
        return
      }

      const item = pendingItems[index]
      index++

      setUploadItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'uploading', progress: 0 } : i
      ))

      try {
        const result = await uploadAPI.uploadSingle(item.file, semester, (percent) => {
          setUploadItems(prev => prev.map(i => 
            i.id === item.id ? { ...i, progress: percent } : i
          ))
        })

        setUploadItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'success', result, progress: 100 } : i
        ))
      } catch (err) {
        setUploadItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'error', error: err.message } : i
        ))
      }

      uploadNext()
    }

    const workers = Array(Math.min(concurrency, pendingItems.length)).fill(null).map(() => uploadNext())
    await Promise.all(workers)
  }

  const clearAll = () => {
    setUploadItems([])
  }

  const clearSuccess = () => {
    setUploadItems(prev => prev.filter(i => i.status !== 'success'))
  }

  const retryFailed = () => {
    setUploadItems(prev => prev.map(i => 
      i.status === 'error' ? { ...i, status: 'pending', progress: 0, error: null } : i
    ))
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
      case 'error': return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
      case 'uploading': return <UploadOutlined style={{ color: '#1890ff', fontSize: 20 }} />
      default: return <InboxOutlined style={{ color: '#bfbfbf', fontSize: 20 }} />
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const successCount = uploadItems.filter(i => i.status === 'success').length
  const errorCount = uploadItems.filter(i => i.status === 'error').length
  const pendingCount = uploadItems.filter(i => i.status === 'pending').length
  const uploadingCount = uploadItems.filter(i => i.status === 'uploading').length

  return (
    <div>
      <Card title="批量上传作品">
        <Space style={{ marginBottom: 16 }} size="large">
          <div>
            <span style={{ marginRight: 8 }}>学期：</span>
            <Select
              value={semester}
              onChange={setSemester}
              style={{ width: 200 }}
              options={semesters.map(s => ({ value: s.name, label: s.name }))}
            />
          </div>
          <Button type="primary" icon={<UploadOutlined />} onClick={startUpload} loading={uploading}>
            开始上传
          </Button>
          <Button onClick={retryFailed} disabled={errorCount === 0 || uploading}>
            重试失败 ({errorCount})
          </Button>
          <Button onClick={clearSuccess} disabled={successCount === 0}>
            清除成功
          </Button>
          <Button onClick={clearAll} disabled={uploading}>
            清空全部
          </Button>
        </Space>

        <div
          className={`upload-area ${dragging ? 'dragover' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <UploadOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <p style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
            拖拽文件到这里，或点击选择文件
          </p>
          <p style={{ fontSize: 12, color: '#999' }}>
            支持图片、视频、PDF 文件，系统会自动根据文件名中的学生姓名归类
          </p>
        </div>

        <Divider />

        <div style={{ marginBottom: 16 }}>
          <Space size="middle">
            <span>共 {uploadItems.length} 个文件</span>
            <Tag color="blue">上传中: {uploadingCount}</Tag>
            <Tag color="green">成功: {successCount}</Tag>
            <Tag color="red">失败: {errorCount}</Tag>
            <Tag color="default">等待中: {pendingCount}</Tag>
          </Space>
        </div>

        <List
          size="small"
          dataSource={uploadItems}
          locale={{ emptyText: '暂无上传文件' }}
          renderItem={(item) => (
            <List.Item
              className={`upload-progress-item ${item.status}`}
              style={{
                background: item.status === 'error' ? '#fff1f0' : item.status === 'success' ? '#f6ffed' : undefined,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  {getStatusIcon(item.status)}
                  <span style={{ flex: 1 }}>{item.name}</span>
                  <span style={{ color: '#999', fontSize: 12 }}>{formatSize(item.size)}</span>
                  {item.result?.student_id ? (
                    <Tag color="green">已归类</Tag>
                  ) : item.status === 'success' ? (
                    <Tag color="orange">待整理</Tag>
                  ) : null}
                </div>
                {item.status === 'uploading' && (
                  <Progress percent={item.progress} size="small" showInfo={false} />
                )}
                {item.status === 'error' && (
                  <span style={{ color: '#ff4d4f', fontSize: 12 }}>{item.error}</span>
                )}
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default Upload
