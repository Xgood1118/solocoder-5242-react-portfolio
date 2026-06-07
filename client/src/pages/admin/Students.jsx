import { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, QrcodeOutlined, ExportOutlined } from '@ant-design/icons'
import { studentsAPI, accessAPI, semestersAPI, exportAPI } from '../../services/api'

function Students() {
  const [students, setStudents] = useState([])
  const [semesters, setSemesters] = useState([])
  const [currentSemester, setCurrentSemester] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [accessModalVisible, setAccessModalVisible] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [accessCodes, setAccessCodes] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [studentData, semesterData] = await Promise.all([
        studentsAPI.list(),
        semestersAPI.list(),
      ])
      setStudents(studentData)
      setSemesters(semesterData)
      const current = semesterData.find(s => s.is_current)
      if (current) setCurrentSemester(current.name)
    } catch (err) {
      message.error('加载数据失败')
    }
  }

  const handleAdd = () => {
    setEditingStudent(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    form.setFieldsValue(student)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await studentsAPI.delete(id)
      message.success('删除成功')
      loadData()
    } catch (err) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingStudent) {
        await studentsAPI.update(editingStudent.id, values)
        message.success('更新成功')
      } else {
        await studentsAPI.create(values)
        message.success('添加成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      message.error('操作失败')
    }
  }

  const handleViewAccess = async (student) => {
    setSelectedStudent(student)
    try {
      const codes = await accessAPI.getByStudent(student.id)
      setAccessCodes(codes)
    } catch (err) {
      message.error('加载访问码失败')
    }
    setAccessModalVisible(true)
  }

  const handleAddAccess = async () => {
    try {
      await accessAPI.create(selectedStudent.id, {})
      message.success('生成成功')
      const codes = await accessAPI.getByStudent(selectedStudent.id)
      setAccessCodes(codes)
    } catch (err) {
      message.error('生成失败')
    }
  }

  const handleDeleteAccess = async (id) => {
    try {
      await accessAPI.delete(id)
      message.success('删除成功')
      const codes = await accessAPI.getByStudent(selectedStudent.id)
      setAccessCodes(codes)
    } catch (err) {
      message.error('删除失败')
    }
  }

  const handleExport = (student) => {
    if (!currentSemester) {
      message.warning('请先设置当前学期')
      return
    }
    exportAPI.portfolioZip(student.id, currentSemester)
  }

  const copyAccessLink = (code) => {
    const link = `${window.location.origin}/parent?code=${code}`
    navigator.clipboard.writeText(link).then(() => {
      message.success('链接已复制')
    })
  }

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '班级', dataIndex: 'class_name', key: 'class_name' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    {
      title: '作品数',
      dataIndex: 'artwork_count',
      key: 'artwork_count',
      render: (count) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" icon={<QrcodeOutlined />} onClick={() => handleViewAccess(record)}>
            访问码
          </Button>
          <Button type="link" size="small" icon={<ExportOutlined />} onClick={() => handleExport(record)}>
            导出
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="学生管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加学生
        </Button>
      }
    >
      <Table
        dataSource={students}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={editingStudent ? '编辑学生' : '添加学生'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="class_name" label="班级">
            <Input placeholder="如：一班、二班" />
          </Form.Item>
          <Form.Item name="grade" label="年级">
            <Input placeholder="如：一年级、二年级" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingStudent ? '保存' : '添加'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${selectedStudent?.name} - 家长访问码`}
        open={accessModalVisible}
        onCancel={() => setAccessModalVisible(false)}
        footer={[
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAddAccess}>
            生成新访问码
          </Button>,
          <Button key="close" onClick={() => setAccessModalVisible(false)}>关闭</Button>,
        ]}
        width={600}
      >
        <Table
          dataSource={accessCodes}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            { title: '访问码', dataIndex: 'code', key: 'code', render: (code) => <Tag color="blue">{code}</Tag> },
            { title: '家长姓名', dataIndex: 'parent_name', key: 'parent_name' },
            { title: '使用次数', dataIndex: 'used_count', key: 'used_count' },
            {
              title: '操作',
              key: 'actions',
              render: (_, record) => (
                <Space size="small">
                  <Button type="link" size="small" onClick={() => copyAccessLink(record.code)}>
                    复制链接
                  </Button>
                  <Popconfirm title="确定删除此访问码？" onConfirm={() => handleDeleteAccess(record.id)}>
                    <Button type="link" size="small" danger>删除</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
        <p style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
          家长访问链接：<code>{window.location.origin}/parent?code=访问码</code>
        </p>
      </Modal>
    </Card>
  )
}

export default Students
