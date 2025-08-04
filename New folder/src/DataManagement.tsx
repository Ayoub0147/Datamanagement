import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
  Tabs,
  Tag,
  Alert,
  Progress,
  Badge,
  Tooltip,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  DatabaseOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  BuildOutlined,
  FileTextOutlined,
  TeamOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// Types
interface BaseEntity {
  id: string;
  name: string;
}

interface Domain extends BaseEntity {}

interface Subdomain extends BaseEntity {
  domain_id: string;
  domain_name: string;
}

interface Category extends BaseEntity {
  subdomain_id: string;
  subdomain_name: string;
  domain_name: string;
  agreement_types?: string[];
}

interface Article extends BaseEntity {
  category_id: string;
  category_name: string;
  subdomain_name: string;
  domain_name: string;
  manufacturers?: Array<{
    id: string;
    manufacturer_id: string;
    manufacturer_name: string;
    certified_by_onee?: boolean;
  }>;
}

interface Manufacturer extends BaseEntity {
  contact?: string;
  phone?: string;
  email?: string;
  is_supplier?: boolean;
}

interface Contractor extends BaseEntity {
  sigle?: string;
  address?: string;
  phone?: string;
  fax?: string;
  country?: string;
}

interface ContractorAgreement {
  id: string;
  contractor_id: string;
  contractor_name: string;
  type: string;
  date_start?: string;
  date_end?: string;
  subdomain_id: string;
  subdomain_name: string;
  domain_name: string;
}

interface CategoryAgreement {
  id: string;
  category_id: string;
  category_name: string;
  subdomain_name: string;
  domain_name: string;
  agreement_type: string;
}

// Configuration for each entity type
const entityConfig = {
  domains: {
    title: 'Domains',
    icon: <DatabaseOutlined />,
    color: '#1890ff',
    fields: ['name'],
    dependencies: []
  },
  subdomains: {
    title: 'Subdomains',
    icon: <DatabaseOutlined />,
    color: '#52c41a',
    fields: ['name', 'domain_id'],
    dependencies: ['domains']
  },
  categories: {
    title: 'Categories',
    icon: <FileTextOutlined />,
    color: '#722ed1',
    fields: ['name', 'subdomain_id', 'agreement_types'],
    dependencies: ['subdomains']
  },
  articles: {
    title: 'Articles',
    icon: <FileTextOutlined />,
    color: '#fa8c16',
    fields: ['name', 'category_id', 'manufacturers'],
    dependencies: ['categories', 'manufacturers']
  },
  manufacturers: {
    title: 'Manufacturers',
    icon: <BuildOutlined />,
    color: '#13c2c2',
    fields: ['name', 'contact', 'phone', 'email', 'is_supplier'],
    dependencies: []
  },
  contractors: {
    title: 'Contractors',
    icon: <TeamOutlined />,
    color: '#eb2f96',
    fields: ['name', 'sigle', 'address', 'phone', 'fax', 'country'],
    dependencies: []
  },
  contractor_agreements: {
    title: 'Contractor Agreements',
    icon: <LinkOutlined />,
    color: '#f5222d',
    fields: ['contractor_id', 'type', 'date_start', 'date_end', 'subdomain_id'],
    dependencies: ['contractors', 'subdomains']
  },
  category_agreements: {
    title: 'Category Agreements',
    icon: <LinkOutlined />,
    color: '#fa541c',
    fields: ['category_id', 'agreement_type'],
    dependencies: ['categories']
  }
};

const DataManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isEditMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('domains');
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // Data states
  const [data, setData] = useState<Record<string, any[]>>({
    domains: [],
    subdomains: [],
    categories: [],
    articles: [],
    manufacturers: [],
    contractors: [],
    contractor_agreements: [],
    category_agreements: []
  });

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const results = await Promise.all([
        fetchDomains(),
        fetchSubdomains(),
        fetchCategories(),
        fetchArticles(),
        fetchManufacturers(),
        fetchContractors(),
        fetchContractorAgreements(),
        fetchCategoryAgreements()
      ]);

      const newData = {
        domains: results[0],
        subdomains: results[1],
        categories: results[2],
        articles: results[3],
        manufacturers: results[4],
        contractors: results[5],
        contractor_agreements: results[6],
        category_agreements: results[7]
      };

      setData(newData);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    const { data, error } = await supabase.from('domains').select('*').order('name');
    if (error) throw error;
    return data || [];
  };

  const fetchSubdomains = async () => {
    const { data, error } = await supabase
      .from('subdomains')
      .select(`
        *,
        domains!inner(name)
      `)
      .order('name');
    
    if (error) throw error;
    return data?.map(item => ({
      ...item,
      domain_name: item.domains.name
    })) || [];
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        subdomains!inner(name, domains!inner(name))
      `)
      .order('name');
    
    if (error) throw error;
    return data?.map(item => ({
      ...item,
      subdomain_name: item.subdomains.name,
      domain_name: item.subdomains.domains.name
    })) || [];
  };

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        *,
        categories!inner(
          name,
          subdomains!inner(
            name,
            domains!inner(name)
          )
        ),
        article_manufacturer(
          id,
          manufacturer_id,
          certified_by_onee,
          manufacturers(name)
        )
      `)
      .order('name');
    
    if (error) throw error;
    return data?.map(item => ({
      ...item,
      category_name: item.categories.name,
      subdomain_name: item.categories.subdomains.name,
      domain_name: item.categories.subdomains.domains.name,
      manufacturers: item.article_manufacturer?.map((am: any) => ({
        id: am.id,
        manufacturer_id: am.manufacturer_id,
        manufacturer_name: am.manufacturers.name,
        certified_by_onee: am.certified_by_onee
      })) || []
    })) || [];
  };

  const fetchManufacturers = async () => {
    const { data, error } = await supabase.from('manufacturers').select('*').order('name');
    if (error) throw error;
    return data || [];
  };

  const fetchContractors = async () => {
    const { data, error } = await supabase.from('contractors').select('*').order('name');
    if (error) throw error;
    return data || [];
  };

  const fetchContractorAgreements = async () => {
    const { data, error } = await supabase
      .from('contractor_agreements')
      .select(`
        *,
        contractors!inner(name),
        subdomains!inner(
          name,
          domains!inner(name)
        )
      `)
      .order('date_start', { ascending: false });
    
    if (error) throw error;
    return data?.map(item => ({
      ...item,
      contractor_name: item.contractors.name,
      subdomain_name: item.subdomains.name,
      domain_name: item.subdomains.domains.name
    })) || [];
  };

  const fetchCategoryAgreements = async () => {
    const { data, error } = await supabase
      .from('category_agreement')
      .select(`
        *,
        categories!inner(
          name,
          subdomains!inner(
            name,
            domains!inner(name)
          )
        )
      `)
      .order('agreement_type');
    
    if (error) throw error;
    return data?.map(item => ({
      ...item,
      category_name: item.categories.name,
      subdomain_name: item.categories.subdomains.name,
      domain_name: item.categories.subdomains.domains.name
    })) || [];
  };

  const getAvailableAgreementTypes = () => {
    // Get unique agreement types from contractor agreements
    const contractorAgreementTypes = Array.from(
      new Set(data.contractor_agreements.map(ca => ca.type))
    ).filter(Boolean);
    
    // Get unique agreement types from existing category agreements
    const categoryAgreementTypes = Array.from(
      new Set(data.category_agreements.map(ca => ca.agreement_type))
    ).filter(Boolean);
    
    // Combine and deduplicate
    return Array.from(new Set([...contractorAgreementTypes, ...categoryAgreementTypes]));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAdd = () => {
    setEditMode(false);
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = async (record: any) => {
    setEditMode(true);
    setEditingRecord(record);
    
    let formValues = { ...record };
    
    // Handle special cases for relationships
    if (activeTab === 'categories') {
      const agreements = data.category_agreements.filter(ca => ca.category_id === record.id);
      formValues.agreement_types = agreements.map(ca => ca.agreement_type);
    }
    
    if (activeTab === 'articles') {
      formValues.manufacturers = record.manufacturers?.map((m: any) => m.manufacturer_id) || [];
    }
    
    form.setFieldsValue(formValues);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      let error;
      
      // Handle cascading deletes
      if (activeTab === 'categories') {
        await supabase.from('category_agreement').delete().eq('category_id', id);
      }
      if (activeTab === 'articles') {
        await supabase.from('article_manufacturer').delete().eq('article_id', id);
      }
      
      const tableName = activeTab.replace('_', '');
      error = (await supabase.from(tableName).delete().eq('id', id)).error;
      
      if (error) throw error;
      
      message.success(`${entityConfig[activeTab as keyof typeof entityConfig].title.slice(0, -1)} deleted successfully`);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting record:', error);
      message.error('Failed to delete record');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const config = entityConfig[activeTab as keyof typeof entityConfig];
      const tableName = activeTab.replace('_', '');
      
      if (isEditMode) {
        // Update existing record
        const { error } = await supabase
          .from(tableName)
          .update(values)
          .eq('id', editingRecord.id);
        
        if (error) throw error;
        
        // Handle relationship updates
        if (activeTab === 'categories' && values.agreement_types) {
          await supabase.from('category_agreement').delete().eq('category_id', editingRecord.id);
          const agreements = values.agreement_types.map((type: string) => ({
            category_id: editingRecord.id,
            agreement_type: type
          }));
          await supabase.from('category_agreement').insert(agreements);
        }
        
        if (activeTab === 'articles' && values.manufacturers) {
          await supabase.from('article_manufacturer').delete().eq('article_id', editingRecord.id);
          const manufacturers = values.manufacturers.map((id: string) => ({
            article_id: editingRecord.id,
            manufacturer_id: id
          }));
          await supabase.from('article_manufacturer').insert(manufacturers);
        }
        
        message.success(`${config.title.slice(0, -1)} updated successfully`);
      } else {
        // Create new record
        const { data, error } = await supabase
          .from(tableName)
          .insert({ ...values, id: crypto.randomUUID() })
          .select();
        
        if (error) throw error;
        
        // Handle relationship creation
        if (activeTab === 'categories' && values.agreement_types && data?.[0]) {
          const agreements = values.agreement_types.map((type: string) => ({
            category_id: data[0].id,
            agreement_type: type
          }));
          await supabase.from('category_agreement').insert(agreements);
        }
        
        if (activeTab === 'articles' && values.manufacturers && data?.[0]) {
          const manufacturers = values.manufacturers.map((id: string) => ({
            article_id: data[0].id,
            manufacturer_id: id
          }));
          await supabase.from('article_manufacturer').insert(manufacturers);
        }
        
        message.success(`${config.title.slice(0, -1)} created successfully`);
      }
      
      setModalVisible(false);
      fetchAllData();
    } catch (error) {
      console.error('Error saving record:', error);
      message.error(`Failed to save record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const renderForm = () => {
    const config = entityConfig[activeTab as keyof typeof entityConfig];
    
    const formFields = {
      name: (
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter name' }]}
        >
          <Input />
        </Form.Item>
      ),
      domain_id: (
        <Form.Item
          name="domain_id"
          label="Domain"
          rules={[{ required: true, message: 'Please select a domain' }]}
        >
          <Select placeholder="Select a domain">
            {data.domains.map(domain => (
              <Select.Option key={domain.id} value={domain.id}>
                {domain.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      ),
      subdomain_id: (
        <Form.Item
          name="subdomain_id"
          label="Subdomain"
          rules={[{ required: true, message: 'Please select a subdomain' }]}
        >
          <Select placeholder="Select a subdomain">
            {data.subdomains.map(subdomain => (
              <Select.Option key={subdomain.id} value={subdomain.id}>
                {subdomain.name} ({subdomain.domain_name})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      ),
      category_id: (
        <Form.Item
          name="category_id"
          label="Category"
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select placeholder="Select a category">
            {data.categories.map(category => (
              <Select.Option key={category.id} value={category.id}>
                {category.name} ({category.subdomain_name})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      ),
      contractor_id: (
        <Form.Item
          name="contractor_id"
          label="Contractor"
          rules={[{ required: true, message: 'Please select a contractor' }]}
        >
          <Select placeholder="Select a contractor">
            {data.contractors.map(contractor => (
              <Select.Option key={contractor.id} value={contractor.id}>
                {contractor.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      ),
      contact: (
        <Form.Item name="contact" label="Contact">
          <Input />
        </Form.Item>
      ),
      phone: (
        <Form.Item name="phone" label="Phone">
          <Input />
        </Form.Item>
      ),
      email: (
        <Form.Item name="email" label="Email">
          <Input />
        </Form.Item>
      ),
      is_supplier: (
        <Form.Item name="is_supplier" label="Is Supplier">
          <Select>
            <Select.Option value={true}>Yes</Select.Option>
            <Select.Option value={false}>No</Select.Option>
          </Select>
        </Form.Item>
      ),
      sigle: (
        <Form.Item name="sigle" label="Sigle">
          <Input />
        </Form.Item>
      ),
      address: (
        <Form.Item name="address" label="Address">
          <Input.TextArea rows={3} />
        </Form.Item>
      ),
      fax: (
        <Form.Item name="fax" label="Fax">
          <Input />
        </Form.Item>
      ),
      country: (
        <Form.Item name="country" label="Country">
          <Input />
        </Form.Item>
      ),
      type: (
        <Form.Item
          name="type"
          label="Agreement Type"
          rules={[{ required: true, message: 'Please enter agreement type' }]}
        >
          <Input placeholder="e.g., public, private, partnership" />
        </Form.Item>
      ),
             agreement_type: (
         <Form.Item
           name="agreement_type"
           label="Agreement Type"
           rules={[{ required: true, message: 'Please select an agreement type' }]}
         >
           <Select 
             placeholder="Select an agreement type"
             showSearch
             filterOption={(input, option) =>
               (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
             }
           >
             {getAvailableAgreementTypes().map(type => (
               <Select.Option key={type} value={type}>
                 {type}
               </Select.Option>
             ))}
           </Select>
         </Form.Item>
       ),
      date_start: (
        <Form.Item name="date_start" label="Start Date">
          <Input type="date" />
        </Form.Item>
      ),
      date_end: (
        <Form.Item name="date_end" label="End Date">
          <Input type="date" />
        </Form.Item>
      ),
      manufacturers: (
        <Form.Item name="manufacturers" label="Manufacturers">
          <Select
            mode="multiple"
            placeholder="Select manufacturers"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {data.manufacturers.map(manufacturer => (
              <Select.Option key={manufacturer.id} value={manufacturer.id}>
                {manufacturer.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      ),
             agreement_types: (
         <Form.Item
           name="agreement_types"
           label="Agreement Types"
           rules={[{ required: true, message: 'Please select at least one agreement type' }]}
         >
           <Select 
             mode="tags" 
             placeholder="Select or type agreement types"
             allowClear
             showSearch
             filterOption={(input, option) =>
               (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
             }
           >
             {getAvailableAgreementTypes().map(type => (
               <Select.Option key={type} value={type}>
                 {type}
               </Select.Option>
             ))}
           </Select>
         </Form.Item>
       )
    };

    return (
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {config.fields.map(field => formFields[field as keyof typeof formFields])}
      </Form>
    );
  };

  const getColumns = (entityType: string) => {
    const baseColumns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: 300,
        render: (text: string, record: any) => {
          const isClickable = ['manufacturers', 'contractors'].includes(entityType);
          
          return (
            <Space direction="vertical" size="small">
              <Text 
                strong 
                style={{ 
                  cursor: isClickable ? 'pointer' : 'default',
                  color: isClickable ? '#1890ff' : 'inherit'
                }}
                onClick={() => {
                  if (isClickable) {
                    navigate(`/${entityType.slice(0, -1)}s/${record.id}`);
                  }
                }}
              >
                {text}
              </Text>
              {record.domain_name && (
                <Space size="small">
                  <Tag color="blue">{record.domain_name}</Tag>
                  {record.subdomain_name && <Text type="secondary">{record.subdomain_name}</Text>}
                </Space>
              )}
            </Space>
          );
        }
      }
    ];

    const actionColumn = {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title={`Are you sure you want to delete this ${entityType.slice(0, -1)}?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    };

    switch (entityType) {
      case 'domains':
        return [...baseColumns, actionColumn];
      
      case 'subdomains':
        return [
          ...baseColumns,
          { title: 'Domain', dataIndex: 'domain_name', key: 'domain_name' },
          actionColumn
        ];
      
      case 'categories':
        return [
          ...baseColumns,
          { 
            title: 'Agreement Types', 
            key: 'agreement_types',
            render: (_: any, record: any) => {
              const agreements = data.category_agreements
                .filter(ca => ca.category_id === record.id)
                .map(ca => ca.agreement_type);
              
              return (
                <div>
                  {agreements.map(agreement => (
                    <Tag key={agreement} color="blue">{agreement}</Tag>
                  ))}
                </div>
              );
            }
          },
          actionColumn
        ];
      
      case 'articles':
        return [
          ...baseColumns,
          { 
            title: 'Manufacturers', 
            key: 'manufacturers',
            render: (_: any, record: any) => (
              <div>
                {record.manufacturers && record.manufacturers.length > 0 ? (
                  <Space wrap>
                    {record.manufacturers.map((manufacturer: any) => (
                      <Space key={manufacturer.id} size="small">
                        <Tag color="blue">{manufacturer.manufacturer_name}</Tag>
                        {manufacturer.certified_by_onee && (
                          <Tag color="green">ONEE Certified</Tag>
                        )}
                      </Space>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">No manufacturers</Text>
                )}
              </div>
            )
          },
          actionColumn
        ];
      
             case 'manufacturers':
         return [
           { 
             title: 'Name', 
             dataIndex: 'name', 
             key: 'name',
             render: (text: string, record: any) => (
               <Text 
                 strong 
                 style={{ 
                   cursor: 'pointer',
                   color: '#1890ff'
                 }}
                 onClick={() => navigate(`/manufacturers/${record.id}`)}
               >
                 {text}
               </Text>
             )
           },
           { title: 'Contact', dataIndex: 'contact', key: 'contact' },
           { title: 'Phone', dataIndex: 'phone', key: 'phone' },
           { title: 'Email', dataIndex: 'email', key: 'email' },
           { 
             title: 'Is Supplier', 
             dataIndex: 'is_supplier', 
             key: 'is_supplier',
             render: (isSupplier: boolean) => (
               <Tag color={isSupplier ? 'green' : 'red'}>
                 {isSupplier ? 'Yes' : 'No'}
               </Tag>
             )
           },
           actionColumn
         ];
      
             case 'contractors':
         return [
           { 
             title: 'Name', 
             dataIndex: 'name', 
             key: 'name',
             render: (text: string, record: any) => (
               <Text 
                 strong 
                 style={{ 
                   cursor: 'pointer',
                   color: '#1890ff'
                 }}
                 onClick={() => navigate(`/contractors/${record.id}`)}
               >
                 {text}
               </Text>
             )
           },
           { title: 'Sigle', dataIndex: 'sigle', key: 'sigle' },
           { title: 'Country', dataIndex: 'country', key: 'country' },
           { title: 'Phone', dataIndex: 'phone', key: 'phone' },
           actionColumn
         ];
      
      case 'contractor_agreements':
        return [
          { title: 'Contractor', dataIndex: 'contractor_name', key: 'contractor_name' },
          { title: 'Type', dataIndex: 'type', key: 'type' },
          { title: 'Subdomain', dataIndex: 'subdomain_name', key: 'subdomain_name' },
          { title: 'Domain', dataIndex: 'domain_name', key: 'domain_name' },
          { title: 'Start Date', dataIndex: 'date_start', key: 'date_start' },
          { title: 'End Date', dataIndex: 'date_end', key: 'date_end' },
          actionColumn
        ];
      
      case 'category_agreements':
        return [
          { title: 'Category', dataIndex: 'category_name', key: 'category_name' },
          { title: 'Subdomain', dataIndex: 'subdomain_name', key: 'subdomain_name' },
          { title: 'Domain', dataIndex: 'domain_name', key: 'domain_name' },
          { title: 'Agreement Type', dataIndex: 'agreement_type', key: 'agreement_type' },
          actionColumn
        ];
      
      default:
        return [...baseColumns, actionColumn];
    }
  };

  const getStatistics = () => {
    const stats = {
      totalDomains: data.domains.length,
      totalSubdomains: data.subdomains.length,
      totalCategories: data.categories.length,
      totalArticles: data.articles.length,
      totalManufacturers: data.manufacturers.length,
      totalContractors: data.contractors.length,
      totalContractorAgreements: data.contractor_agreements.length,
      totalCategoryAgreements: data.category_agreements.length,
      linkedArticles: data.articles.filter(a => a.manufacturers?.length > 0).length,
      suppliers: data.manufacturers.filter(m => m.is_supplier).length
    };

    return stats;
  };

  const stats = getStatistics();
  const currentData = data[activeTab as keyof typeof data] || [];
  const filteredData = currentData.filter(item => 
    item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.category_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.subdomain_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.domain_name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const tabItems = Object.keys(entityConfig).map(key => ({
    key,
    label: (
      <Space>
        {entityConfig[key as keyof typeof entityConfig].icon}
        {entityConfig[key as keyof typeof entityConfig].title}
        <Badge count={data[key as keyof typeof data]?.length || 0} showZero />
      </Space>
    ),
    children: (
      <div>
        {/* Search and Actions */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Input
                placeholder={`Search ${entityConfig[key as keyof typeof entityConfig].title.toLowerCase()}...`}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchAllData}>
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  Add {entityConfig[key as keyof typeof entityConfig].title.slice(0, -1)}
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>



        {/* Table */}
        <Table
          columns={getColumns(key)}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>
    )
  }));

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <DatabaseOutlined style={{ marginRight: '8px' }} />
            Data Management
          </Title>
          <Text type="secondary">
            Manage domains, subdomains, categories, articles, manufacturers, and supporting data for project creation
          </Text>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={3}>
            <Card>
              <Statistic
                title="Domains"
                value={stats.totalDomains}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card>
              <Statistic
                title="Subdomains"
                value={stats.totalSubdomains}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card>
              <Statistic
                title="Categories"
                value={stats.totalCategories}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card>
              <Statistic
                title="Articles"
                value={stats.totalArticles}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card>
              <Statistic
                title="Manufacturers"
                value={stats.totalManufacturers}
                prefix={<BuildOutlined />}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card>
              <Statistic
                title="Contractors"
                value={stats.totalContractors}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card>
              <Statistic
                title="Suppliers"
                value={stats.suppliers}
                valueStyle={{ color: '#1890ff' }}
                prefix={<SettingOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={tabItems}
        />

        <Modal
          title={`${isEditMode ? 'Edit' : 'Add'} ${entityConfig[activeTab as keyof typeof entityConfig].title.slice(0, -1)}`}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={600}
        >
          {renderForm()}
          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" onClick={() => form.submit()}>
                {isEditMode ? 'Update' : 'Create'}
              </Button>
            </Space>
          </div>
        </Modal>
      </Card>
    </div>
  );
};

export default DataManagement;