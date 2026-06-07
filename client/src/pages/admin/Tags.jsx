import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Modal, Form, Input, Select,
  Switch, message, Space, Popconfirm, Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { tagsAPI } from '../../services/api'

function Tags() {
  const [tags, setTags] = useState([])
  const [categories, setCategories] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [tagData, categoryData] = await Promise.all([
        tagsAPI.list(),
        tagsAPI.categories(),
      ])
      setTags(tagData)
      setCategories(categoryData)
    } catch (err) {
      message.error('加载失败')
    }
  }

  const handleAdd = () => {
    setEditingTag(null)
    form.resetFields()
    form.setFieldsValue({ is_internal: false })
    setModalVisible(true)
  }

  const handleEdit = (tag) => {
    setEditingTag(tag)
    form.setFieldsValue(tag)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await tagsAPI.delete(id)
      message.success('删除成功')
      loadData()
    } catch (err) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingTag) {
        await tagsAPI.update(editingTag.id, values)
        message.success('更新成功')
      } else {
        await tagsAPI.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      message.error('操作失败')
    }
  }

  const groupedTags = categories.reduce((acc, cat) => {
    acc[cat.category] = tags.filter(t => t.category === cat.category)
    return acc
  }, {})

  return (
    <Card
      title="标签管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建标签
        </Button>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {Object.entries(groupedTags).map(([category, tagList]) => (
          <div key={category}>
            <h3 style={{ marginBottom: 12, color: '#333' }}>
              {category}
              <Tag style={{ marginLeft: 8 }} color="blue">{tagList.length} 个标签</Tag>
            </h3>
            <Table
              dataSource={tagList}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '标签名', dataIndex: 'name', key: 'name' },
                {
                  title: '类型',
                  dataIndex: 'is_internal',
                  key: 'is_internal',
                  render: (v) => v ? <Tag color="default">内部</Tag> : <Tag color="green">公开</Tag>,
                },
                {
                  title: '操作',
                  key: 'actions',
                  render: (_, record) => (
                    <Space size="small">
                      <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        编辑
                      </Button>
                      <Popconfirm title="确定删除此标签？" onConfirm={() => handleDelete(record.id)}>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </div>
        ))}
      </Space>

      <Modal
        title={editingTag ? '编辑标签' : '新建标签'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="标签名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="所属分类" rules={[{ required: true }]}>
            <Select
              mode={undefined}
              allowClear
              placeholder="选择分类或输入新分类"
              options={categories.map(c => ({ value: c.category, label: c.category }))}
            >
              {categories.map(c => (
                <Select.Option key={c.category} value={c.category}>
                  {c.category}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="is_internal" label="内部标签（家长不可见）" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingTag ? '保存' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default Tags
