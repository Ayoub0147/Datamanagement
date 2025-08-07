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
<<<<<<< HEAD
  message,
  DatePicker
} from 'antd';
import { supabase } from './supabaseClient';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
=======
  message
} from 'antd';
import { supabase } from './supabaseClient';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de

const { Title } = Typography;

function ManufacturerSearch() {
  const [search, setSearch] = useState('');
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
<<<<<<< HEAD
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [minEarnings, setMinEarnings] = useState<number>(0);
=======
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [form] = Form.useForm();
<<<<<<< HEAD
  const [earningsYear, setEarningsYear] = useState<number | null>(null);
  const [earningsValue, setEarningsValue] = useState<number | null>(null);

  useEffect(() => {
    fetchManufacturers(search, selectedYear, minEarnings);
  }, [search, selectedYear, minEarnings]);

  const fetchManufacturers = async (searchValue: string, year: number | null, minEarnings: number) => {
    setLoading(true);
    setError(null);
    let query;
    if (year !== null) {
      // INNER JOIN: only manufacturers with earnings for the selected year
      query = supabase
        .from('manufacturers')
        .select(`
          id,
          name,
          contact,
          phone,
          email,
          manufacturer_earnings:manufacturer_earnings!inner(year,earnings)
        `)
        .eq('manufacturer_earnings.year', year)
        .gte('manufacturer_earnings.earnings', minEarnings)
        .order('name');
    } else {
      // LEFT JOIN: show all manufacturers
      query = supabase
        .from('manufacturers')
        .select(`
          id,
          name,
          contact,
          phone,
          email,
          manufacturer_earnings:manufacturer_earnings(year,earnings)
        `)
        .order('name');
    }
    if (searchValue) {
      query = query.ilike('name', `%${searchValue}%`);
    }
=======

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

>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
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
<<<<<<< HEAD
    // If manufacturer_earnings exists, prefill year and earnings
    const earningsArr = Array.isArray(record.manufacturer_earnings) ? record.manufacturer_earnings : [];
    form.setFieldsValue({
      ...record,
      earningsYear: earningsArr.length > 0 ? earningsArr[0].year : undefined,
      earningsValue: earningsArr.length > 0 ? earningsArr[0].earnings : undefined
    });
=======
    form.setFieldsValue(record);
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
    setModalType('edit');
    setEditTarget(record);
    setModalVisible(true);
  };

<<<<<<< HEAD
  const handleSubmit = async (values: any) => {
    try {
      const { name, contact, phone, email, earningsYear, earningsValue } = values;
      let manufacturerId = editTarget ? editTarget.id : (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
      if (modalType === 'add') {
        console.log('Inserting manufacturer:', { id: manufacturerId, name, contact, phone, email });
        const { error } = await supabase
          .from('manufacturers')
          .insert({ id: manufacturerId, name, contact, phone, email });
        if (error) {
          throw error;
        }
        // Insert earnings if provided
        if (earningsYear && earningsValue != null) {
          const { error: earningsError } = await supabase.from('manufacturer_earnings').insert({ manufacturer_id: manufacturerId, year: earningsYear, earnings: earningsValue });
          if (earningsError) throw earningsError;
        }
        message.success('Manufacturer added');
      } else if (editTarget) {
        const { error } = await supabase
          .from('manufacturers')
          .update({ name, contact, phone, email })
          .eq('id', manufacturerId);
        if (error) {
          throw error;
        }
        // Upsert earnings if provided
        if (earningsYear && earningsValue != null) {
          const { error: earningsError } = await supabase
            .from('manufacturer_earnings')
            .upsert([{ manufacturer_id: manufacturerId, year: earningsYear, earnings: earningsValue }], { onConflict: 'manufacturer_id,year' });
          if (earningsError) throw earningsError;
        }
        message.success('Manufacturer updated');
      }
      setModalVisible(false);
      fetchManufacturers(search, selectedYear, minEarnings);
    } catch (error) {
      let errorMsg = 'Unknown error';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMsg = (error as any).message;
        } else {
          errorMsg = JSON.stringify(error);
        }
      } else if (typeof error === 'string') {
        errorMsg = error;
      }
      Modal.error({ title: 'Error', content: errorMsg });
    }
=======
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
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
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
<<<<<<< HEAD
        fetchManufacturers(search, selectedYear, minEarnings);
=======
        fetchManufacturers(search);
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
      }
    });
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Contact', dataIndex: 'contact' },
    { title: 'Phone', dataIndex: 'phone' },
    { title: 'Email', dataIndex: 'email' },
<<<<<<< HEAD
    { title: 'Yearly Earnings', dataIndex: ['manufacturer_earnings', '0', 'earnings'],
      render: (_: any, record: any) => {
        const earningsArr = Array.isArray(record.manufacturer_earnings) ? record.manufacturer_earnings : [];
        const earningsValue = earningsArr.length > 0 ? earningsArr[0].earnings : null;
        return earningsValue != null ? earningsValue.toLocaleString() : 'N/A';
      }
    },
=======
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
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
<<<<<<< HEAD
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, gap: 16 }}>
=======
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} style={{ marginRight: 16 }}>
          Add Manufacturer
        </Button>
        <Input.Search
          placeholder="Search by name"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
<<<<<<< HEAD
          style={{ width: 200 }}
        />
        <DatePicker
          picker="year"
          value={selectedYear ? dayjs(`${selectedYear}`, 'YYYY') : null}
          onChange={(_, dateString) => setSelectedYear(dateString ? Number(dateString) : null)}
          style={{ width: 120 }}
          placeholder="Year"
          allowClear
        />
        <Input
          type="number"
          min={0}
          value={minEarnings}
          onChange={e => setMinEarnings(Number(e.target.value))}
          placeholder="Min Earnings"
          style={{ width: 140 }}
=======
          style={{ width: 400 }}
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
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
<<<<<<< HEAD
        onOk={() => form.submit()}
        okText={modalType === 'add' ? 'Add' : 'Update'}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item name="contact" label="Contact"> <Input /> </Form.Item>
          <Form.Item name="phone" label="Phone"> <Input /> </Form.Item>
          <Form.Item name="email" label="Email"> <Input /> </Form.Item>
          <Form.Item name="earningsYear" label="Year (for earnings)">
            <Input type="number" min={1900} max={2100} placeholder="Year" />
          </Form.Item>
          <Form.Item name="earningsValue" label="Earnings">
            <Input type="number" min={0} placeholder="Earnings" />
=======
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
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default ManufacturerSearch;
