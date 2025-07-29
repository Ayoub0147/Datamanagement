import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, List, Spin, Button, Descriptions, Empty, Table, Modal, Form, Input, message } from 'antd';
import { supabase } from './supabaseClient';
import { ArrowLeftOutlined } from '@ant-design/icons';

const ManufacturerInfo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manufacturer, setManufacturer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchManufacturer = async () => {
      const { data, error } = await supabase
        .from('manufacturers')
        .select(`
          id, name, contact, phone, email,
          manufacturer_contacts0 ( id, contact_name, phone, email )
        `)
        .eq('id', id)
        .single();
      setManufacturer(data);
      setLoading(false);
      if (data) form.setFieldsValue({
        name: data.name,
        contact: data.contact,
        phone: data.phone,
        email: data.email
      });
    };
    fetchManufacturer();
  }, [id]);

  const handleEdit = () => {
    setEditModalVisible(true);
    form.setFieldsValue({
      name: manufacturer.name,
      contact: manufacturer.contact,
      phone: manufacturer.phone,
      email: manufacturer.email
    });
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const { error } = await supabase
        .from('manufacturers')
        .update(values)
        .eq('id', id);
      setSaving(false);
      if (error) {
        message.error(error.message);
        return;
      }
      setManufacturer({ ...manufacturer, ...values });
      setEditModalVisible(false);
      message.success('Manufacturer updated');
    } catch (err) {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;
  if (!manufacturer) return <Typography.Text type="danger">Manufacturer not found.</Typography.Text>;
  
  const contactColumns = [
    { title: 'Contact Name', dataIndex: 'contact_name', key: 'contact_name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
  ];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/manufacturers')} style={{ marginBottom: 24 }}>
        Back to Manufacturer Search
      </Button>
      <Typography.Title level={2}>Manufacturer Information</Typography.Title>
      <Card style={{ marginBottom: 24 }}>
        <Descriptions title={manufacturer.name} bordered column={1} size="middle">
          <Descriptions.Item label="Main Contact">{manufacturer.contact}</Descriptions.Item>
          <Descriptions.Item label="Phone">{manufacturer.phone}</Descriptions.Item>
          <Descriptions.Item label="Email">{manufacturer.email}</Descriptions.Item>
        </Descriptions>
        <Button type="primary" onClick={handleEdit} style={{ marginTop: 16 }}>Edit</Button>
      </Card>
      <Typography.Title level={4}>Additional Contacts</Typography.Title>
      <Table
        columns={contactColumns}
        dataSource={manufacturer.manufacturer_contacts0 || []}
        rowKey="id"
        pagination={false}
        bordered
        locale={{ emptyText: <Empty description="No additional contacts found." /> }}
      />
      <Modal
        title="Edit Manufacturer"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleEditSubmit}
        confirmLoading={saving}
        okText="Save"
      >
        <Form layout="vertical" form={form} initialValues={{
          name: manufacturer?.name,
          contact: manufacturer?.contact,
          phone: manufacturer?.phone,
          email: manufacturer?.email
        }}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item name="contact" label="Main Contact"> <Input /> </Form.Item>
          <Form.Item name="phone" label="Phone"> <Input /> </Form.Item>
          <Form.Item name="email" label="Email"> <Input /> </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManufacturerInfo; 