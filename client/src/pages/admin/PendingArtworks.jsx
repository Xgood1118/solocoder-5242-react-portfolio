import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Select, Modal, Form, Input,
  message, Space, Image, Tag, Rate, DatePicker, Row, Col,
  Switch,
} from 'antd'
import { CheckOutlined, EditOutlined, UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { artworksAPI, studentsAPI, tagsAPI } from '../../services/api'

function PendingArtworks() {
  const [artworks, setArtworks] = useState([])
  const [students, setStudents] = useState([])
  const [tags, setTags] = useState([])
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [currentArtwork, setCurrentArtwork] = useState(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [batchAssignVisible, setBatchAssignVisible] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [batchStudent, setBatchStudent] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [artworkData, studentData, tagData] = await Promise.all([
        artworksAPI.list({ pending: 'true' }),
        studentsAPI.list(),
        tagsAPI.list(),
      ])
      setArtworks(artworkData)
      setStudents(studentData)
      setTags(tagData)
    } catch (err) {
      message.error('加载数据失败')
    }
    setLoading(false)
  }

  const handleAssign = (artwork) => {
    setCurrentArtwork(artwork)
    form.setFieldsValue({
      title: artwork.original_name,
      tag_ids: [],
      created_date: dayjs(),
      is_final_excellent: false,
    })
    setEditModalVisible(true)
  }

  const handleAssignSubmit = async (values) => {
    try {
      const data = {
        ...values,
        created_date: values.created_date ? values.created_date.format('YYYY-MM-DD') : null,
        pending_student: 0,
        tag_ids: values.tag_ids || [],
      }
      await artworksAPI.update(currentArtwork.id, data)
      message.success('已归类')
      setEditModalVisible(false)
      setSelectedRowKeys(prev => prev.filter(k => k !== currentArtwork.id))
      loadData()
    } catch (err) {
      message.error('操作失败')
    }
  }

  const handleBatchAssign = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择作品')
      return
    }
    setBatchAssignVisible(true)
  }

  const handleBatchAssignSubmit = async () => {
    if (!batchStudent) {
      message.warning('请选择学生')
      return
    }
    try {
      await Promise.all(
        selectedRowKeys.map(id => 
          artworksAPI.update(id, { student_id: batchStudent, pending_student: 0 })
        )
      )
      message.success(`已将 ${selectedRowKeys.length} 个作品归类`)
      setBatchAssignVisible(false)
      setSelectedRowKeys([])
      loadData()
    } catch (err) {
      message.error('操作失败')
    }
  }

  const gradeToRate = (grade) => {
    if (!grade) return 0
    return { A: 4, B: 3, C: 2, D: 1 }[grade] || 0
  }

  const rateToGrade = (rate) => {
    return { 4: 'A', 3: 'B', 2: 'C', 1: 'D' }[rate] || null
  }

  const columns = [
    {
      title: '预览',
      key: 'preview',
      width: 80,
      render: (_, record) => {
        if (record.file_type === 'image') {
          return <Image src={record.file_path} width={60} height={60} style={{ objectFit: 'cover', borderRadius: 4 }} preview={false} />
        }
        if (record.file_type === 'video') {
          return <div style={{ width: 60, height: 60, background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>🎬</div>
        }
        if (record.file_type === 'pdf') {
          return <div style={{ width: 60, height: 60, background: '#ff4d4f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: 12 }}>PDF</div>
        }
        return null
      },
    },
    {
      title: '文件名',
      dataIndex: 'original_name',
      key: 'original_name',
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (type) => {
        const typeMap = { image: '图片', video: '视频', pdf: 'PDF', other: '其他' }
        return <Tag>{typeMap[type] || type}</Tag>
      },
    },
    {
      title: '学期',
      dataIndex: 'semester',
      key: 'semester',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<UserOutlined />}
            onClick={() => handleAssign(record)}
          >
            归类
          </Button>
        </Space>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }

  return (
    <Card
      title={
        <Space>
          待整理作品
          <Tag color="orange">{artworks.length} 个待归类</Tag>
        </Space>
      }
      extra={
        <Button 
          type="primary" 
          icon={<CheckOutlined />} 
          onClick={handleBatchAssign}
          disabled={selectedRowKeys.length === 0}
        >
          批量归类 ({selectedRowKeys.length})
        </Button>
      }
    >
      <Table
        dataSource={artworks}
        columns={columns}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: '没有待整理的作品 🎉' }}
      />

      <Modal
        title="归类作品"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={520}
      >
        {currentArtwork && (
          <Form form={form} layout="vertical" onFinish={handleAssignSubmit}>
            <Form.Item name="student_id" label="选择学生" rules={[{ required: true, message: '请选择学生' }]}>
              <Select
                showSearch
                optionFilterProp="children"
                placeholder="搜索学生姓名"
                options={students.map(s => ({ value: s.id, label: s.name }))}
              />
            </Form.Item>
            <Form.Item name="title" label="作品名称">
              <Input />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="grade" label="评分">
                  <Rate
                    count={4}
                    character={({ index }) => ['D', 'C', 'B', 'A'][index]}
                    value={gradeToRate(form.getFieldValue('grade'))}
                    onChange={(val) => form.setFieldsValue({ grade: rateToGrade(val) })}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="created_date" label="创作日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="materials" label="材料">
              <Input placeholder="水彩/油画/综合材料等" />
            </Form.Item>
            <Form.Item name="comment" label="评语">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="tag_ids" label="标签">
              <Select mode="multiple" style={{ width: '100%' }} placeholder="选择标签">
                {tags.filter(t => !t.is_internal).map(tag => (
                  <Select.Option key={tag.id} value={tag.id}>
                    {tag.category} - {tag.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="is_final_excellent" label="期末优秀" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">确认归类</Button>
                <Button onClick={() => setEditModalVisible(false)}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="批量归类"
        open={batchAssignVisible}
        onCancel={() => setBatchAssignVisible(false)}
        onOk={handleBatchAssignSubmit}
        okText="确认归类"
      >
        <p>已选择 <strong>{selectedRowKeys.length}</strong> 个作品</p>
        <Select
          value={batchStudent}
          onChange={setBatchStudent}
          style={{ width: '100%', marginTop: 16 }}
          showSearch
          placeholder="选择要归类到的学生"
          options={students.map(s => ({ value: s.id, label: s.name }))}
        />
      </Modal>
    </Card>
  )
}

export default PendingArtworks
