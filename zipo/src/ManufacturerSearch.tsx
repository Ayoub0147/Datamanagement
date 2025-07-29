import React, { useState, useEffect } from 'react';
import {
  Input,
  Table,
  Typography,
  Space,
  Spin,
  Alert,
  Modal,
  Button,
  Form,
  message
} from 'antd';
import { supabase } from './supabaseClient';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

function ManufacturerSearch() {
  const [search, setSearch] = useState('');
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchManufacturers(search);
  }, [search]);

  const fetchManufacturers = async (searchValue: string) => {
    setLoading(true);
    setError(null);
    const query = supabase
      .from('manufacturers')
      .select(`
        id,
        name,
        contact,
        phone,
        email,
        manufacturer_contacts (
          id,
          contact_name,
          phone,
          email
        )
      `)
      .order('name');

    if (searchValue) {
      query.ilike('name', `%${searchValue}%`);
    }

    const { data, error } = await query;
    if (error) {
      setError(error.message);
      setManufacturers([]);
    } else {
      setManufacturers(data || []);
    }
    setLoading(false);
  };

  const openAdd = () => {
    form.resetFields();
    setModalType('add');
    setEditTarget(null);
    setModalVisible(true);
  };

  const openEdit = (record: any) => {
    form.setFieldsValue(record);
    setModalType('edit');
    setEditTarget(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (modalType === 'add') {
      const id = crypto.randomUUID();
      const { error } = await supabase
        .from('manufacturers')
        .insert({ id, ...values });
      if (error) {
        Modal.error({ title: 'Add failed', content: error.message });
        return;
      }
      message.success('Manufacturer added');
    } else if (editTarget) {
      const { error } = await supabase
        .from('manufacturers')
        .update(values)
        .eq('id', editTarget.id);
      if (error) {
        Modal.error({ title: 'Update failed', content: error.message });
        return;
      }
      message.success('Manufacturer updated');
    }
    setModalVisible(false);
    fetchManufacturers(search);
  };

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: 'Delete manufacturer?',
      content: 'This will delete the manufacturer and all contacts.',
      okType: 'danger',
      onOk: async () => {
        const { error } = await supabase
          .from('manufacturers')
          .delete()
          .eq('id', record.id);
        if (error) {
          message.error(error.message);
          return;
        }
        message.success('Deleted');
        fetchManufacturers(search);
      }
    });
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Contact', dataIndex: 'contact' },
    { title: 'Phone', dataIndex: 'phone' },
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Actions',
      render: (_: any, record: any) => (
        <Space>
          <EditOutlined onClick={() => openEdit(record)} />
          <DeleteOutlined onClick={() => handleDelete(record)} />
        </Space>
      )
    }
  ];

  const expandedRowRender = (record: any) => {
    const contacts = record.manufacturer_contacts || [];
    if (contacts.length === 0) return 'No contacts';
    return (
      <Table
        columns={[
          { title: 'Contact Name', dataIndex: 'contact_name' },
          { title: 'Phone', dataIndex: 'phone' },
          { title: 'Email', dataIndex: 'email' }
        ]}
        dataSource={contacts}
        rowKey="id"
        pagination={false}
        size="small"
        bordered
      />
    );
  };

  return (
    <>
      <Title level={2} style={{ textAlign: 'center' }}>Manufacturer Directory</Title>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} style={{ marginRight: 16 }}>
          Add Manufacturer
        </Button>
        <Input.Search
          placeholder="Search by name"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 400 }}
        />
      </div>
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      {loading ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : (
        <Table
          dataSource={manufacturers}
          columns={columns}
          rowKey="id"
          expandable={{ expandedRowRender }}
          pagination={{ pageSize: 8 }}
          bordered
        />
      )}
      <Modal
        title={modalType === 'add' ? 'Add Manufacturer' : 'Edit Manufacturer'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText={modalType === 'add' ? 'Add' : 'Update'}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contact" label="Contact">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default ManufacturerSearch;
