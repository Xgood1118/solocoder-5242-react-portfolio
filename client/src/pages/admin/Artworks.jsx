import { useState, useEffect } from 'react'
import {
  Card, Select, Table, Button, Modal, Form, Input, Rate,
  Tag, Space, Popconfirm, message, Drawer, Checkbox, Row, Col,
  DatePicker, Image, Badge, Switch, Tooltip,
} from 'antd'
import {
  EditOutlined, DeleteOutlined, EyeOutlined,
  EyeInvisibleOutlined, TrophyOutlined, FilterOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { artworksAPI, studentsAPI, tagsAPI, semestersAPI } from '../../services/api'

function Artworks() {
  const [artworks, setArtworks] = useState([])
  const [students, setStudents] = useState([])
  const [tags, setTags] = useState([])
  const [tagCategories, setTagCategories] = useState([])
  const [semesters, setSemesters] = useState([])
  const [currentSemester, setCurrentSemester] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [filterVisible, setFilterVisible] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState([])
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [currentArtwork, setCurrentArtwork] = useState(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadArtworks()
  }, [selectedSemester, selectedStudent, selectedTagIds])

  const loadData = async () => {
    try {
      const [studentData, tagData, categoryData, semesterData] = await Promise.all([
        studentsAPI.list(),
        tagsAPI.list(),
        tagsAPI.categories(),
        semestersAPI.list(),
      ])
      setStudents(studentData)
      setTags(tagData)
      setTagCategories(categoryData)
      setSemesters(semesterData)
      const current = semesterData.find(s => s.is_current)
      if (current) {
        setCurrentSemester(current.name)
        setSelectedSemester(current.name)
      }
    } catch (err) {
      message.error('加载数据失败')
    }
  }

  const loadArtworks = async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedSemester) params.semester = selectedSemester
      if (selectedStudent) params.student_id = selectedStudent
      const data = await artworksAPI.list(params)
      
      if (selectedTagIds.length > 0) {
        setArtworks(data.filter(a => 
          selectedTagIds.some(tid => a.tags?.some(t => t.id === tid))
        ))
      } else {
        setArtworks(data)
      }
    } catch (err) {
      message.error('加载作品失败')
    }
    setLoading(false)
  }

  const handleEdit = (artwork) => {
    setCurrentArtwork(artwork)
    form.setFieldsValue({
      ...artwork,
      tag_ids: artwork.tags?.map(t => t.id) || [],
      created_date: artwork.created_date ? dayjs(artwork.created_date) : null,
    })
    setEditModalVisible(true)
  }

  const handleEditSubmit = async (values) => {
    try {
      const data = {
        ...values,
        created_date: values.created_date ? values.created_date.format('YYYY-MM-DD') : null,
        tag_ids: values.tag_ids || [],
      }
      await artworksAPI.update(currentArtwork.id, data)
      message.success('保存成功')
      setEditModalVisible(false)
      loadArtworks()
    } catch (err) {
      message.error('保存失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await artworksAPI.delete(id)
      message.success('删除成功')
      loadArtworks()
    } catch (err) {
      message.error('删除失败')
    }
  }

  const handleToggleHidden = async (artwork) => {
    try {
      await artworksAPI.update(artwork.id, { is_hidden: !artwork.is_hidden })
      message.success(artwork.is_hidden ? '已显示' : '已隐藏')
      loadArtworks()
    } catch (err) {
      message.error('操作失败')
    }
  }

  const handleToggleExcellent = async (artwork) => {
    try {
      await artworksAPI.update(artwork.id, { is_final_excellent: !artwork.is_final_excellent })
      message.success(artwork.is_final_excellent ? '已取消期末优秀' : '已设为期末优秀')
      loadArtworks()
    } catch (err) {
      message.error('操作失败')
    }
  }

  const handlePreview = (artwork) => {
    setCurrentArtwork(artwork)
    setPreviewVisible(true)
  }

  const gradeToRate = (grade) => {
    if (!grade) return 0
    return { A: 4, B: 3, C: 2, D: 1 }[grade] || 0
  }

  const rateToGrade = (rate) => {
    return { 4: 'A', 3: 'B', 2: 'C', 1: 'D' }[rate] || null
  }

  const renderFilePreview = (artwork, size = 'small') => {
    if (artwork.file_type === 'image') {
      return (
        <Image
          src={artwork.file_path}
          alt={artwork.title || artwork.file_name}
          width={size === 'small' ? 60 : '100%'}
          height={size === 'small' ? 60 : 'auto'}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={false}
        />
      )
    }
    if (artwork.file_type === 'video') {
      return <div style={{ width: 60, height: 60, background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: 20 }}>🎬</div>
    }
    if (artwork.file_type === 'pdf') {
      return <div style={{ width: 60, height: 60, background: '#ff4d4f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: 12 }}>PDF</div>
    }
    return <div style={{ width: 60, height: 60, background: '#f0f0f0', borderRadius: 4 }} />
  }

  const columns = [
    {
      title: '预览',
      dataIndex: 'file_path',
      key: 'preview',
      width: 80,
      render: (_, record) => (
        <a onClick={() => handlePreview(record)}>{renderFilePreview(record)}</a>
      ),
    },
    {
      title: '作品名称',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <div>{title || record.original_name || record.file_name}</div>
          {record.is_final_excellent && <Tag color="gold" icon={<TrophyOutlined />}>期末优秀</Tag>}
        </div>
      ),
    },
    {
      title: '学生',
      dataIndex: ['student', 'name'],
      key: 'student',
      render: (name, record) => name || <Tag color="orange">待整理</Tag>,
    },
    {
      title: '评分',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade) => grade ? (
        <span className={`grade-badge grade-${grade}`}>{grade}</span>
      ) : '-',
    },
    {
      title: '材料',
      dataIndex: 'materials',
      key: 'materials',
      ellipsis: true,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) => (
        <Space size={[4, 4]} wrap>
          {tags?.slice(0, 3).map(tag => (
            <Tag key={tag.id} color={tag.is_internal ? 'default' : 'blue'}>
              {tag.name}
            </Tag>
          ))}
          {tags?.length > 3 && <Tag>+{tags.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '创作日期',
      dataIndex: 'created_date',
      key: 'created_date',
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => (
        <Space>
          {record.is_hidden && <Tag color="default">已隐藏</Tag>}
          {record.pending_student && <Tag color="warning">待整理</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={record.is_hidden ? '显示' : '隐藏'}>
            <Button
              type="text"
              size="small"
              icon={record.is_hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => handleToggleHidden(record)}
            />
          </Tooltip>
          <Tooltip title="期末优秀">
            <Button
              type="text"
              size="small"
              icon={<TrophyOutlined />}
              style={{ color: record.is_final_excellent ? '#faad14' : undefined }}
              onClick={() => handleToggleExcellent(record)}
            />
          </Tooltip>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="作品管理"
      extra={
        <Space>
          <Select
            value={selectedSemester}
            onChange={setSelectedSemester}
            style={{ width: 180 }}
            options={semesters.map(s => ({ value: s.name, label: s.name }))}
          />
          <Select
            value={selectedStudent}
            onChange={setSelectedStudent}
            style={{ width: 150 }}
            allowClear
            placeholder="选择学生"
            options={students.map(s => ({ value: s.id, label: s.name }))}
          />
          <Button icon={<FilterOutlined />} onClick={() => setFilterVisible(true)}>
            标签筛选
          </Button>
        </Space>
      }
    >
      <Table
        dataSource={artworks}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Drawer
        title="标签筛选"
        placement="right"
        open={filterVisible}
        onClose={() => setFilterVisible(false)}
        width={320}
      >
        {tagCategories.map(cat => (
          <div key={cat.category} style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 8 }}>{cat.category}</h4>
            <Checkbox.Group
              value={selectedTagIds.filter(id => cat.all_tag_ids.includes(id))}
              onChange={(values) => {
                const otherIds = selectedTagIds.filter(id => !cat.all_tag_ids.includes(id))
                setSelectedTagIds([...otherIds, ...values])
              }}
            >
              <Row gutter={[8, 8]}>
                {tags.filter(t => t.category === cat.category).map(tag => (
                  <Col span={24} key={tag.id}>
                    <Checkbox value={tag.id}>
                      {tag.name}
                      {tag.is_internal && <Tag style={{ marginLeft: 8 }} color="default">内部</Tag>}
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </div>
        ))}
        <Button onClick={() => setSelectedTagIds([])}>清除筛选</Button>
      </Drawer>

      <Modal
        title="编辑作品"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        {currentArtwork && (
          <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="title" label="作品名称">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="student_id" label="学生">
                  <Select
                    options={students.map(s => ({ value: s.id, label: s.name }))}
                    allowClear
                  />
                </Form.Item>
              </Col>
            </Row>
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
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="tag_ids" label="标签">
              <Select mode="multiple" style={{ width: '100%' }}>
                {tags.map(tag => (
                  <Select.Option key={tag.id} value={tag.id}>
                    {tag.category} - {tag.name}
                    {tag.is_internal && ' (内部)'}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="is_final_excellent" label="期末优秀" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="is_hidden" label="对家长隐藏" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">保存</Button>
                <Button onClick={() => setEditModalVisible(false)}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title={currentArtwork?.title || currentArtwork?.original_name || '作品预览'}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        className="preview-modal"
      >
        {currentArtwork && currentArtwork.file_type === 'image' && (
          <img src={currentArtwork.file_path} alt="" className="preview-image" />
        )}
        {currentArtwork && currentArtwork.file_type === 'video' && (
          <video src={currentArtwork.file_path} controls className="preview-video" />
        )}
        {currentArtwork && currentArtwork.file_type === 'pdf' && (
          <iframe src={currentArtwork.file_path} className="preview-pdf" title="PDF Preview" />
        )}
      </Modal>
    </Card>
  )
}

export default Artworks
