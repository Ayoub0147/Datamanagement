import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import {
  Input, Table, Tag, Typography, Space, Spin, Alert, Modal, Descriptions, Button, Select, Checkbox, Form, message
} from 'antd';
=======
import { Input, Table, Tag, Typography, Space, Spin, Alert, Modal, Descriptions, Button, Select, Checkbox, Form, message } from 'antd';
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
import { supabase } from './supabaseClient';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

function ProductSearch() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<any | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [editPairs, setEditPairs] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [oneeFilter, setOneeFilter] = useState<string>('');
  const [isAddMode, setIsAddMode] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select(`
        id, name,
        category:categories(name),
        article_manufacturer:article_manufacturer(
          certified_by_onee,
          manufacturer:manufacturers(id, name, contact, phone, email)
        )
      `);
    if (articlesError) {
      setError(articlesError.message);
      setLoading(false);
      return;
    }
    const articles = articlesData || [];
    setData(articles.map((article: any, index: number) => ({
      key: `${article.id}-${index}`,
      id: article.id,
      name: article.name,
      category: article.category?.name || '',
      manufacturerReferences: (article.article_manufacturer || []).map((am: any, amIndex: number) => ({
        manufacturer: am.manufacturer,
        certified_by_onee: am.certified_by_onee,
        uniqueKey: `${am.manufacturer.id}-${amIndex}`
      })),
      certified_by_onee: (article.article_manufacturer || []).some((am: any) => am.certified_by_onee),
      onManufacturerClick: (m: any) => {
        setSelectedManufacturer(m);
        setModalVisible(true);
      },
    })));
    setLoading(false);
  };

  const fetchCategoriesAndManufacturers = async () => {
    const { data: cats } = await supabase.from('categories').select('id, name');
    setCategories(cats || []);
    const { data: mans } = await supabase.from('manufacturers').select('id, name');
    setManufacturers(mans || []);
  };

  useEffect(() => {
    fetchArticles();
    fetchCategoriesAndManufacturers();
  }, []);

  const handleEdit = (record: any) => {
    setEditRecord(record);
    setEditName(record.name);
    setEditCategory(record.category);
    setEditPairs(record.manufacturerReferences.map((mr: any) => ({
      manufacturerId: mr.manufacturer.id,
      certified_by_onee: mr.certified_by_onee,
    })));
    setEditModalVisible(true);
  };

  const handlePairChange = (idx: number, field: string, value: any) => {
    setEditPairs(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleAddPair = () => {
    setEditPairs(prev => [...prev, {
      manufacturerId: manufacturers[0]?.id || null,
      certified_by_onee: false
    }]);
  };

  const handleRemovePair = (idx: number) => {
    setEditPairs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddProduct = () => {
    setIsAddMode(true);
    setEditRecord(null);
    setEditName('');
    setEditCategory(categories[0]?.name || '');
    setEditPairs([{ manufacturerId: manufacturers[0]?.id || null, certified_by_onee: false }]);
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
<<<<<<< HEAD
    setActionLoading(true);
    const catObj = categories.find(c => c.name === editCategory) || categories[0];
    let articleId = editRecord?.id;
    if (isAddMode) {
=======
    console.log('handleEditSubmit called');
    setActionLoading(true);
    const catObj = categories.find(c => c.name === editCategory) || categories[0];
    let articleId = editRecord?.id;
    console.log('isAddMode:', isAddMode);
    console.log('Submitting values:', { name: editName, category: editCategory, catObj, editPairs });
    if (isAddMode) {
      // Insert new article with UUID
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
      const newArticleId = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from('articles')
        .insert({ id: newArticleId, name: editName, category_id: catObj?.id });
<<<<<<< HEAD
=======
      console.log('Insert article result:', { newArticleId, insertError });
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
      if (insertError) {
        Modal.error({ title: 'Add failed', content: insertError.message || String(insertError) });
        setActionLoading(false);
        return;
      }
      articleId = newArticleId;
    } else {
<<<<<<< HEAD
=======
      // Update existing article
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
      const { error: articleError } = await supabase
        .from('articles')
        .update({ name: editName, category_id: catObj?.id })
        .eq('id', articleId);
<<<<<<< HEAD
=======
      console.log('Update article result:', { articleError });
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
      if (articleError) {
        Modal.error({ title: 'Update failed', content: articleError.message || String(articleError) });
        setActionLoading(false);
        return;
      }
<<<<<<< HEAD
      await supabase.from('article_manufacturer').delete().eq('article_id', articleId);
    }
=======
      // Remove old manufacturer pairs
      await supabase.from('article_manufacturer').delete().eq('article_id', articleId);
    }
    // Insert manufacturer/reference pairs with UUIDs
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
    for (const pair of editPairs) {
      const newAMId = crypto.randomUUID();
      const { error: insError } = await supabase
        .from('article_manufacturer')
        .insert({
          id: newAMId,
          article_id: articleId,
          manufacturer_id: pair.manufacturerId,
          certified_by_onee: pair.certified_by_onee,
        });
<<<<<<< HEAD
=======
      console.log('Insert manufacturer pair result:', { pair, insError });
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
      if (insError) {
        Modal.error({ title: isAddMode ? 'Add failed' : 'Update failed', content: insError.message || String(insError) });
        setActionLoading(false);
        return;
      }
    }
    setActionLoading(false);
    setEditModalVisible(false);
    setIsAddMode(false);
    message.success(isAddMode ? 'Product added' : 'Article updated');
    fetchArticles();
<<<<<<< HEAD
  };

  const handleDelete = (record: any) => {
=======
    console.log('Modal closed, product added/updated');
  };

  const handleDelete = (record: any) => {
    console.log('handleDelete called', record);
    console.log('About to call Modal.confirm');
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
    Modal.confirm({
      title: 'Delete this article?',
      icon: <ExclamationCircleOutlined />,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      okButtonProps: { loading: actionLoading },
      onOk: async () => {
<<<<<<< HEAD
        setActionLoading(true);
        const articleId = record.id;
=======
        console.log('Modal OK clicked for delete', record);
        setActionLoading(true);
        const articleId = record.id;
        console.log('Deleting article and related pairs with id:', articleId);
        // Delete all related article_manufacturer rows by article_id (UUID)
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
        const { error: amError } = await supabase
          .from('article_manufacturer')
          .delete()
          .eq('article_id', articleId);
        if (amError) {
          Modal.error({ title: 'Delete failed', content: amError.message || String(amError) });
          setActionLoading(false);
          return;
        }
<<<<<<< HEAD
=======
        // Delete the article itself by id (UUID)
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
        const { error: articleError } = await supabase
          .from('articles')
          .delete()
          .eq('id', articleId);
        if (articleError) {
          Modal.error({ title: 'Delete failed', content: articleError.message || String(articleError) });
          setActionLoading(false);
          return;
        }
        setActionLoading(false);
        message.success('Article deleted');
        fetchArticles();
      },
    });
  };

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) &&
    (categoryFilter === '' || item.category === categoryFilter) &&
    (oneeFilter === '' || (oneeFilter === 'certified' ? item.certified_by_onee : !item.certified_by_onee))
  );

  const columns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Manufacturers',
      dataIndex: 'manufacturerReferences',
      key: 'manufacturerReferences',
      render: (_: any, record: any) => (
        <Space wrap size="small">
          {record.manufacturerReferences.map((mr: any) => (
            <Tag
              key={mr.uniqueKey}
              onClick={e => { e.stopPropagation(); record.onManufacturerClick(mr.manufacturer); }}
            >
              {mr.manufacturer.name}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 100,
      render: (_: any, record: any) => (
        <Space size="middle">
          <EditOutlined onClick={() => handleEdit(record)} />
<<<<<<< HEAD
          <DeleteOutlined onClick={() => handleDelete(record)} />
=======
          <DeleteOutlined onClick={() => { console.log('Delete icon clicked', record); handleDelete(record); }} />
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
        </Space>
      )
    }
  ];

  return (
    <>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32, color: '#1890ff' }}>Product Search</Title>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, gap: 16 }}>
        <Button type="primary" onClick={handleAddProduct} style={{ marginRight: 16 }}>Add Product</Button>
        <Input.Search
          placeholder="Search for a product..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 400, fontSize: 16, borderRadius: 8 }}
          allowClear
          enterButton
          size="large"
        />
        <Select
          placeholder="Filter by category"
          value={categoryFilter}
          onChange={val => setCategoryFilter(val)}
          allowClear
          style={{ width: 320 }}
          dropdownMatchSelectWidth={false}
          options={[
            { label: 'All', value: '' },
            ...categories.map(c => ({ label: c.name, value: c.name }))
          ]}
        />
        <Select
          placeholder="Certified by ONEE"
          value={oneeFilter}
          onChange={val => setOneeFilter(val)}
          allowClear
          style={{ width: 180 }}
          options={[
            { label: 'All', value: '' },
            { label: 'Certified', value: 'certified' },
            { label: 'Not Certified', value: 'not_certified' }
          ]}
        />
      </div>
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 8 }}
          bordered
          size="middle"
          style={{ background: '#fff', borderRadius: 12 }}
          scroll={{ x: 1000 }}
        />
      )}
      <Modal
        title={selectedManufacturer?.name}
        open={modalVisible}
        footer={null}
        onCancel={() => setModalVisible(false)}
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Contact">{selectedManufacturer?.contact || '-'}</Descriptions.Item>
          <Descriptions.Item label="Phone">{selectedManufacturer?.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Email">{selectedManufacturer?.email || '-'}</Descriptions.Item>
        </Descriptions>
      </Modal>
      <Modal
        title={isAddMode ? 'Add Product' : 'Edit Product'}
        open={editModalVisible}
        onCancel={() => { setEditModalVisible(false); setIsAddMode(false); }}
        onOk={handleEditSubmit}
        confirmLoading={actionLoading}
        width={700}
      >
        <Form layout="vertical">
          <Form.Item label="Name">
            <Input value={editName} onChange={e => setEditName(e.target.value)} />
          </Form.Item>
          <Form.Item label="Category">
            <Select
<<<<<<< HEAD
              showSearch
              placeholder="Select a category"
              value={editCategory}
              onChange={val => setEditCategory(val)}
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
=======
              value={editCategory}
              onChange={val => setEditCategory(val)}
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
              options={categories.map(c => ({ label: c.name, value: c.name }))}
            />
          </Form.Item>
          <Form.Item label="Manufacturers">
            {editPairs.map((pair, idx) => (
              <Space key={idx} align="start" style={{ marginBottom: 8 }}>
                <Select
<<<<<<< HEAD
                  showSearch
                  placeholder="Select a manufacturer"
                  value={pair.manufacturerId}
                  onChange={val => handlePairChange(idx, 'manufacturerId', val)}
                  filterOption={(input, option) =>
                    (option?.label as string).toLowerCase().includes(input.toLowerCase())
                  }
                  options={manufacturers.map(m => ({ label: m.name, value: m.id }))}
                />
=======
                  value={pair.manufacturerId}
                  onChange={val => handlePairChange(idx, 'manufacturerId', val)}
                  options={manufacturers.map(m => ({ label: m.name, value: m.id }))}
                />

>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
                <Checkbox
                  checked={pair.certified_by_onee}
                  onChange={e => handlePairChange(idx, 'certified_by_onee', e.target.checked)}
                >
                  ONEE
                </Checkbox>
                <Button danger onClick={() => handleRemovePair(idx)} disabled={editPairs.length === 1}>
                  Remove
                </Button>
              </Space>
            ))}
            <Button type="dashed" block onClick={handleAddPair}>Add Manufacturer</Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

<<<<<<< HEAD
export default ProductSearch;
=======
export default ProductSearch; 
>>>>>>> df1c5c830e47d86bb002e7b1585cc657ce69b0de
