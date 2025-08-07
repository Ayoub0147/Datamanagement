import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Space,
  message,
  Tag,
  Badge,
  Row,
  Col,
  Statistic,
  Alert,
  Input,
  Checkbox,
  Divider,
  List,
  Avatar,
  Tooltip,
  Progress
} from 'antd';
import { 
  LinkOutlined, 
  DisconnectOutlined,
  PlusOutlined, 
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  BuildOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { supabase } from './supabaseClient';

const { Title, Text } = Typography;
const { Option } = Select;

interface Article {
  id: string;
  name: string;
  category_name: string;
  subdomain_name: string;
  domain_name: string;
  manufacturers_count: number;
}

interface Manufacturer {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  is_supplier?: boolean;
  articles_count: number;
}

interface ArticleManufacturer {
  id: string;
  article_id: string;
  manufacturer_id: string;
  certified_by_onee: boolean;
  article_name: string;
  manufacturer_name: string;
  category_name: string;
  subdomain_name: string;
  domain_name: string;
}

const ArticleManufacturerManager: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [articleManufacturers, setArticleManufacturers] = useState<ArticleManufacturer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterDomain, setFilterDomain] = useState<string>('');
  const [filterSupplier, setFilterSupplier] = useState<boolean | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchArticles(),
        fetchManufacturers(),
        fetchArticleManufacturers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id,
        name,
        categories!inner(name, subdomains!inner(name, domains!inner(name))),
        article_manufacturer!inner(count)
      `)
      .order('name');
    
    if (!error && data) {
      setArticles(data.map(article => ({
        id: article.id,
        name: article.name,
        category_name: article.categories?.[0]?.name || '',
        subdomain_name: article.categories?.[0]?.subdomains?.[0]?.name || '',
        domain_name: article.categories?.[0]?.subdomains?.[0]?.domains?.[0]?.name || '',
        manufacturers_count: article.article_manufacturer?.[0]?.count || 0
      })));
    }
  };

  const fetchManufacturers = async () => {
    const { data, error } = await supabase
      .from('manufacturers')
      .select(`
        id,
        name,
        contact,
        phone,
        email,
        is_supplier,
        article_manufacturer!inner(count)
      `)
      .order('name');
    
    if (!error && data) {
      setManufacturers(data.map(manufacturer => ({
        ...manufacturer,
        articles_count: manufacturer.article_manufacturer?.[0]?.count || 0
      })));
    }
  };

  const fetchArticleManufacturers = async () => {
    const { data, error } = await supabase
      .from('article_manufacturer')
      .select(`
        id,
        article_id,
        manufacturer_id,
        certified_by_onee,
        articles!inner(name, categories!inner(name, subdomains!inner(name, domains!inner(name)))),
        manufacturers!inner(name)
      `)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setArticleManufacturers(data.map(am => ({
        id: am.id,
        article_id: am.article_id,
        manufacturer_id: am.manufacturer_id,
        certified_by_onee: am.certified_by_onee,
        article_name: am.articles?.[0]?.name || '',
        manufacturer_name: am.manufacturers?.[0]?.name || '',
        category_name: am.articles?.[0]?.categories?.[0]?.name || '',
        subdomain_name: am.articles?.[0]?.categories?.[0]?.subdomains?.[0]?.name || '',
        domain_name: am.articles?.[0]?.categories?.[0]?.subdomains?.[0]?.domains?.[0]?.name || ''
      })));
    }
  };

  const handleLinkArticle = (article: Article) => {
    setSelectedArticle(article);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    if (!selectedArticle) return;

    try {
      const { error } = await supabase
        .from('article_manufacturer')
        .insert({
          id: crypto.randomUUID(),
          article_id: selectedArticle.id,
          manufacturer_id: values.manufacturer_id,
          certified_by_onee: values.certified_by_onee || false
        });

      if (error) throw error;

      message.success('Article linked to manufacturer successfully');
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(`Failed to link article: ${error.message}`);
    }
  };

  const handleUnlink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('article_manufacturer')
        .delete()
        .eq('id', id);

      if (error) throw error;

      message.success('Link removed successfully');
      fetchData();
    } catch (error: any) {
      message.error(`Failed to remove link: ${error.message}`);
    }
  };

  const getStatistics = () => {
    const totalArticles = articles.length;
    const linkedArticles = articles.filter(a => a.manufacturers_count > 0).length;
    const totalManufacturers = manufacturers.length;
    const suppliers = manufacturers.filter(m => m.is_supplier).length;
    const totalLinks = articleManufacturers.length;
    const certifiedLinks = articleManufacturers.filter(am => am.certified_by_onee).length;

    return {
      totalArticles,
      linkedArticles,
      totalManufacturers,
      suppliers,
      totalLinks,
      certifiedLinks
    };
  };

  const stats = getStatistics();

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         article.category_name.toLowerCase().includes(searchText.toLowerCase());
    const matchesDomain = !filterDomain || article.domain_name === filterDomain;
    return matchesSearch && matchesDomain;
  });

  const filteredManufacturers = manufacturers.filter(manufacturer => {
    if (filterSupplier === null) return true;
    return manufacturer.is_supplier === filterSupplier;
  });

  const columns = [
    {
      title: 'Article',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Article) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Space size="small">
            <Tag color="blue">{record.domain_name}</Tag>
            <Text type="secondary">{record.category_name} • {record.subdomain_name}</Text>
          </Space>
        </Space>
      )
    },
    {
      title: 'Manufacturers',
      dataIndex: 'manufacturers_count',
      key: 'manufacturers_count',
      render: (count: number, record: Article) => (
        <Space>
          <Badge count={count} showZero style={{ backgroundColor: count > 0 ? '#52c41a' : '#d9d9d9' }} />
          {count === 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>No manufacturers</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Article) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<LinkOutlined />}
            onClick={() => handleLinkArticle(record)}
          >
            Link Manufacturer
          </Button>
          {record.manufacturers_count > 0 && (
            <Button 
              size="small" 
              icon={<DisconnectOutlined />}
              onClick={() => {/* Show existing links */}}
            >
              Manage Links
            </Button>
          )}
        </Space>
      )
    }
  ];

  const linkColumns = [
    {
      title: 'Article',
      dataIndex: 'article_name',
      key: 'article_name',
      render: (text: string, record: ArticleManufacturer) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Space size="small">
            <Tag color="blue">{record.domain_name}</Tag>
            <Text type="secondary">{record.category_name}</Text>
          </Space>
        </Space>
      )
    },
    {
      title: 'Manufacturer',
      dataIndex: 'manufacturer_name',
      key: 'manufacturer_name',
      render: (text: string, record: ArticleManufacturer) => (
        <Text strong>{text}</Text>
      )
    },
    {
      title: 'ONEE Certified',
      dataIndex: 'certified_by_onee',
      key: 'certified_by_onee',
      render: (certified: boolean) => (
        <Tag color={certified ? 'green' : 'red'}>
          {certified ? 'Yes' : 'No'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: ArticleManufacturer) => (
        <Button 
          type="link" 
          danger 
          size="small" 
          icon={<DisconnectOutlined />}
          onClick={() => handleUnlink(record.id)}
        >
          Unlink
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <LinkOutlined style={{ marginRight: '8px' }} />
            Article-Manufacturer Relationship Manager
          </Title>
          <Text type="secondary">
            Manage relationships between articles and manufacturers, track ONEE certifications
          </Text>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={4}>
            <Card>
              <Statistic
                title="Total Articles"
                value={stats.totalArticles}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Linked Articles"
                value={stats.linkedArticles}
                valueStyle={{ color: '#3f8600' }}
                prefix={<LinkOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Total Manufacturers"
                value={stats.totalManufacturers}
                prefix={<BuildOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Suppliers"
                value={stats.suppliers}
                valueStyle={{ color: '#1890ff' }}
                prefix={<SettingOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Total Links"
                value={stats.totalLinks}
                prefix={<LinkOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="ONEE Certified"
                value={stats.certifiedLinks}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Data Health Check */}
        <Alert
          message="Data Health Check"
          description={
            <div>
              <Text>
                {stats.totalArticles - stats.linkedArticles} articles need manufacturer links
              </Text>
              <Progress 
                percent={Math.round((stats.linkedArticles / stats.totalArticles) * 100)} 
                size="small" 
                style={{ marginTop: 8 }}
              />
            </div>
          }
          type={stats.linkedArticles === stats.totalArticles ? "success" : "warning"}
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* Filters */}
        <Card title="Filters" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Input
                placeholder="Search articles..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col span={8}>
              <Select
                placeholder="Filter by domain"
                allowClear
                value={filterDomain}
                onChange={setFilterDomain}
                style={{ width: '100%' }}
                options={Array.from(new Set(articles.map(a => a.domain_name))).map(domain => ({
                  label: domain,
                  value: domain
                }))}
              />
            </Col>
            <Col span={8}>
              <Select
                placeholder="Filter manufacturers"
                allowClear
                value={filterSupplier}
                onChange={setFilterSupplier}
                style={{ width: '100%' }}
                options={[
                  { label: 'All', value: null },
                  { label: 'Suppliers Only', value: true },
                  { label: 'Manufacturers Only', value: false }
                ]}
              />
            </Col>
          </Row>
        </Card>

        {/* Articles Table */}
        <Card title="Articles" extra={
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Refresh
          </Button>
        }>
          <Table
            columns={columns}
            dataSource={filteredArticles}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Existing Links */}
        <Card title="Existing Article-Manufacturer Links" style={{ marginTop: 24 }}>
          <Table
            columns={linkColumns}
            dataSource={articleManufacturers}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Link Modal */}
        <Modal
          title={`Link Manufacturers to: ${selectedArticle?.name}`}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="manufacturer_id"
              label="Select Manufacturer"
              rules={[{ required: true, message: 'Please select a manufacturer' }]}
            >
              <Select
                placeholder="Choose a manufacturer"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={filteredManufacturers.map(manufacturer => ({
                  label: `${manufacturer.name}${manufacturer.is_supplier ? ' (Supplier)' : ''}`,
                  value: manufacturer.id
                }))}
              />
            </Form.Item>

            <Form.Item
              name="certified_by_onee"
              label="ONEE Certification"
              valuePropName="checked"
            >
              <Checkbox>Certified by ONEE</Checkbox>
            </Form.Item>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" onClick={() => form.submit()}>
                  Link Article
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default ArticleManufacturerManager; 