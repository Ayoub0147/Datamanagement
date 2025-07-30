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
  Tag
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DatabaseOutlined } from '@ant-design/icons';
import { supabase } from './supabaseClient';

const { Title, Text } = Typography;

interface Domain {
  id: string;
  name: string;
}

interface Subdomain {
  id: string;
  name: string;
  domain_id: string;
  domain_name: string;
}

interface Category {
  id: string;
  name: string;
  subdomain_id: string;
  subdomain_name: string;
}

interface Article {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  subdomain_name: string;
  domain_name: string;
  manufacturers?: ArticleManufacturerInfo[];
}

interface Manufacturer {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  is_supplier?: boolean;
}

interface ArticleManufacturerInfo {
  id: string;
  manufacturer_id: string;
  manufacturer_name: string;
  reference?: string;
  certified_by_onee?: boolean;
}

interface ArticleManufacturer {
  id: string;
  article_id: string;
  manufacturer_id: string;
  reference?: string;
  certified_by_onee?: boolean;
  article_name: string;
  manufacturer_name: string;
}

interface Contractor {
  id: string;
  name: string;
  sigle?: string;
  address?: string;
  phone?: string;
  fax?: string;
  country?: string;
}

interface ContractorAgreement {
  id: string;
  contractor_id: string;
  type: string;
  date_start?: string;
  date_end?: string;
  subdomain_id: string;
  contractor_name: string;
  subdomain_name: string;
  domain_name: string;
}

interface CategoryAgreement {
  id: string;
  category_id: string;
  agreement_type: string;
  category_name: string;
  subdomain_name: string;
  domain_name: string;
}

const DataManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isEditMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('domains');

  // Data states
  const [domains, setDomains] = useState<Domain[]>([]);
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorAgreements, setContractorAgreements] = useState<ContractorAgreement[]>([]);
  const [categoryAgreements, setCategoryAgreements] = useState<CategoryAgreement[]>([]);
  const [agreementTypes, setAgreementTypes] = useState<string[]>([]);

  const [form] = Form.useForm();

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDomains(),
        fetchSubdomains(),
        fetchCategories(),
        fetchArticles(),
        fetchManufacturers(),
        fetchContractors(),
        fetchContractorAgreements(),
        fetchCategoryAgreements(),
        fetchAgreementTypes()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .order('name');
    
    if (error) throw error;
    setDomains(data || []);
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
    setSubdomains(data?.map(item => ({
      ...item,
      domain_name: item.domains.name
    })) || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        subdomains!inner(name)
      `)
      .order('name');
    
    if (error) throw error;
    setCategories(data?.map(item => ({
      ...item,
      subdomain_name: item.subdomains.name
    })) || []);
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
          reference,
          certified_by_onee,
          manufacturers(name)
        )
      `)
      .order('name');
    
    if (error) throw error;
    setArticles(data?.map(item => ({
      ...item,
      category_name: item.categories.name,
      subdomain_name: item.categories.subdomains.name,
      domain_name: item.categories.subdomains.domains.name,
      manufacturers: item.article_manufacturer?.map((am: any) => ({
        id: am.id,
        manufacturer_id: am.manufacturer_id,
        manufacturer_name: am.manufacturers.name,
        reference: am.reference,
        certified_by_onee: am.certified_by_onee
      })) || []
    })) || []);
  };

  const fetchManufacturers = async () => {
    const { data, error } = await supabase
      .from('manufacturers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    setManufacturers(data || []);
  };



  const fetchContractors = async () => {
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .order('name');
    
    if (error) throw error;
    setContractors(data || []);
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
    setContractorAgreements(data?.map(item => ({
      ...item,
      contractor_name: item.contractors.name,
      subdomain_name: item.subdomains.name,
      domain_name: item.subdomains.domains.name
    })) || []);
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
    setCategoryAgreements(data?.map(item => ({
      ...item,
      category_name: item.categories.name,
      subdomain_name: item.categories.subdomains.name,
      domain_name: item.categories.subdomains.domains.name
    })) || []);
  };

  const fetchAgreementTypes = async () => {
    const { data, error } = await supabase
      .from('category_agreement')
      .select('agreement_type')
      .order('agreement_type');
    
    if (error) throw error;
    
    // Get unique agreement types
    const uniqueTypes = Array.from(new Set(data?.map(item => item.agreement_type) || []));
    setAgreementTypes(uniqueTypes);
  };

  useEffect(() => {
    fetchAllData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = () => {
    setEditMode(false);
    setEditingRecord(null);
    setModalTitle(`Add ${activeTab.slice(0, -1)}`);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = async (record: any) => {
    setEditMode(true);
    setEditingRecord(record);
    setModalTitle(`Edit ${activeTab.slice(0, -1)}`);
    
    let formValues = { ...record };
    
    // For categories, fetch agreement types
    if (activeTab === 'categories') {
      try {
        const { data: categoryAgreements, error } = await supabase
          .from('category_agreement')
          .select('agreement_type')
          .eq('category_id', record.id);
        
        if (!error && categoryAgreements) {
          formValues.agreement_types = categoryAgreements.map(ca => ca.agreement_type);
        }
      } catch (error) {
        console.error('Error fetching agreement types:', error);
      }
    }
    
    // For articles, fetch manufacturer IDs and references
    if (activeTab === 'articles') {
      try {
        const { data: articleManufacturers, error } = await supabase
          .from('article_manufacturer')
          .select('manufacturer_id, reference')
          .eq('article_id', record.id);
        
        if (!error && articleManufacturers) {
          formValues.manufacturers = articleManufacturers.map(am => am.manufacturer_id);
          
          // Set manufacturer references
          const manufacturerReferences: { [key: string]: string } = {};
          articleManufacturers.forEach(am => {
            if (am.reference) {
              manufacturerReferences[am.manufacturer_id] = am.reference;
            }
          });
          formValues.manufacturer_references = manufacturerReferences;
        }
      } catch (error) {
        console.error('Error fetching article manufacturers:', error);
      }
    }
    
    form.setFieldsValue(formValues);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      let error;
      
      switch (activeTab) {
        case 'domains':
          error = (await supabase.from('domains').delete().eq('id', id)).error;
          break;
        case 'subdomains':
          error = (await supabase.from('subdomains').delete().eq('id', id)).error;
          break;
        case 'categories':
          // Delete category_agreement entries first
          await supabase.from('category_agreement').delete().eq('category_id', id);
          error = (await supabase.from('categories').delete().eq('id', id)).error;
          break;
        case 'articles':
          error = (await supabase.from('articles').delete().eq('id', id)).error;
          break;
        case 'manufacturers':
          error = (await supabase.from('manufacturers').delete().eq('id', id)).error;
          break;

        case 'contractors':
          error = (await supabase.from('contractors').delete().eq('id', id)).error;
          break;
        case 'contractor_agreements':
          error = (await supabase.from('contractor_agreements').delete().eq('id', id)).error;
          break;
        case 'category_agreements':
          error = (await supabase.from('category_agreement').delete().eq('id', id)).error;
          break;
      }
      
      if (error) throw error;
      
      message.success(`${activeTab.slice(0, -1)} deleted successfully`);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting record:', error);
      message.error('Failed to delete record');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (isEditMode) {
        // Update existing record
        let error;
        
        switch (activeTab) {
          case 'domains':
            error = (await supabase
              .from('domains')
              .update({ name: values.name })
              .eq('id', editingRecord.id)).error;
            break;
          case 'subdomains':
            error = (await supabase
              .from('subdomains')
              .update({ 
                name: values.name,
                domain_id: values.domain_id 
              })
              .eq('id', editingRecord.id)).error;
            break;
          case 'categories':
            error = (await supabase
              .from('categories')
              .update({ 
                name: values.name,
                subdomain_id: values.subdomain_id 
              })
              .eq('id', editingRecord.id)).error;
            
            if (!error && values.agreement_types) {
              // Delete existing category_agreement entries
              await supabase.from('category_agreement').delete().eq('category_id', editingRecord.id);
              
              // Insert new category_agreement entries
              const categoryAgreements = values.agreement_types.map((agreementType: string) => ({
                category_id: editingRecord.id,
                agreement_type: agreementType
              }));
              
              error = (await supabase.from('category_agreement').insert(categoryAgreements)).error;
            }
            break;
          case 'articles':
            error = (await supabase
              .from('articles')
              .update({ 
                name: values.name, 
                category_id: values.category_id
              })
              .eq('id', editingRecord.id)).error;
            
            if (!error && values.manufacturers) {
              // Delete existing article_manufacturer entries
              await supabase.from('article_manufacturer').delete().eq('article_id', editingRecord.id);
              
              // Insert new article_manufacturer entries with references
              const articleManufacturers = values.manufacturers.map((manufacturerId: string) => ({
                article_id: editingRecord.id,
                manufacturer_id: manufacturerId,
                reference: values.manufacturer_references?.[manufacturerId] || null
              }));
              
              error = (await supabase.from('article_manufacturer').insert(articleManufacturers)).error;
            }
            break;
          case 'manufacturers':
            error = (await supabase
              .from('manufacturers')
              .update({ 
                name: values.name, 
                contact: values.contact,
                phone: values.phone,
                email: values.email,
                is_supplier: values.is_supplier
              })
              .eq('id', editingRecord.id)).error;
            break;

          case 'contractors':
            error = (await supabase
              .from('contractors')
              .update({ 
                name: values.name, 
                sigle: values.sigle,
                address: values.address,
                phone: values.phone,
                fax: values.fax,
                country: values.country
              })
              .eq('id', editingRecord.id)).error;
            break;
          case 'contractor_agreements':
            error = (await supabase
              .from('contractor_agreements')
              .update({ 
                contractor_id: values.contractor_id,
                type: values.type,
                date_start: values.date_start,
                date_end: values.date_end,
                subdomain_id: values.subdomain_id
              })
              .eq('id', editingRecord.id)).error;
            break;
          case 'category_agreements':
            error = (await supabase
              .from('category_agreement')
              .update({ 
                category_id: values.category_id,
                agreement_type: values.agreement_type
              })
              .eq('id', editingRecord.id)).error;
            break;
        }
        
        if (error) throw error;
        message.success(`${activeTab.slice(0, -1)} updated successfully`);
      } else {
        // Create new record
        let result: any;
        
        // Generate UUID for tables that don't have DEFAULT gen_random_uuid()
        const generateUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };
        
        switch (activeTab) {
          case 'domains':
            result = await supabase
              .from('domains')
              .insert({ 
                id: generateUUID(),
                name: values.name 
              })
              .select();
            break;
          case 'subdomains':
            result = await supabase
              .from('subdomains')
              .insert({ 
                id: generateUUID(),
                name: values.name,
                domain_id: values.domain_id 
              })
              .select();
            break;
          case 'categories':
            result = await supabase
              .from('categories')
              .insert({ 
                id: generateUUID(),
                name: values.name,
                subdomain_id: values.subdomain_id 
              })
              .select();
            
            if (result?.data && values.agreement_types) {
              // Insert category_agreement entries
              const categoryAgreements = values.agreement_types.map((agreementType: string) => ({
                category_id: result.data[0].id,
                agreement_type: agreementType
              }));
              
              const { error: insertError } = await supabase.from('category_agreement').insert(categoryAgreements);
              if (insertError) {
                console.error('Supabase error:', insertError);
                throw insertError;
              }
            }
            break;
          case 'articles':
            result = await supabase
              .from('articles')
              .insert({ 
                id: generateUUID(),
                name: values.name, 
                category_id: values.category_id
              })
              .select();
            
            if (result?.data && values.manufacturers) {
              // Insert article_manufacturer entries with references
              const articleManufacturers = values.manufacturers.map((manufacturerId: string) => ({
                article_id: result.data[0].id,
                manufacturer_id: manufacturerId,
                reference: values.manufacturer_references?.[manufacturerId] || null
              }));
              
              const { error: insertError } = await supabase.from('article_manufacturer').insert(articleManufacturers);
              if (insertError) {
                console.error('Supabase error:', insertError);
                throw insertError;
              }
            }
            break;
          case 'manufacturers':
            result = await supabase
              .from('manufacturers')
              .insert({ 
                id: generateUUID(),
                name: values.name, 
                contact: values.contact,
                phone: values.phone,
                email: values.email,
                is_supplier: values.is_supplier
              })
              .select();
            break;

          case 'contractors':
            result = await supabase
              .from('contractors')
              .insert({ 
                id: generateUUID(),
                name: values.name, 
                sigle: values.sigle,
                address: values.address,
                phone: values.phone,
                fax: values.fax,
                country: values.country
              })
              .select();
            break;
          case 'contractor_agreements':
            result = await supabase
              .from('contractor_agreements')
              .insert({ 
                id: generateUUID(),
                contractor_id: values.contractor_id,
                type: values.type,
                date_start: values.date_start,
                date_end: values.date_end,
                subdomain_id: values.subdomain_id
              })
              .select();
            break;
          case 'category_agreements':
            result = await supabase
              .from('category_agreement')
              .insert({ 
                category_id: values.category_id,
                agreement_type: values.agreement_type
              })
              .select();
            break;
        }
        
        if (result?.error) {
          console.error('Supabase error:', result.error);
          throw result.error;
        }
        message.success(`${activeTab.slice(0, -1)} created successfully`);
      }
      
      setModalVisible(false);
      fetchAllData();
    } catch (error) {
      console.error('Error saving record:', error);
      message.error(`Failed to save record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'domains':
        return (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Domain Name"
              rules={[{ required: true, message: 'Please enter domain name' }]}
            >
              <Input />
            </Form.Item>
          </Form>
        );

      case 'subdomains':
        return (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Subdomain Name"
              rules={[{ required: true, message: 'Please enter subdomain name' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="domain_id"
              label="Domain"
              rules={[{ required: true, message: 'Please select a domain' }]}
            >
              <Select placeholder="Select a domain">
                {domains.map(domain => (
                  <Select.Option key={domain.id} value={domain.id}>
                    {domain.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        );

      case 'categories':
        return (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Category Name"
              rules={[{ required: true, message: 'Please enter category name' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="subdomain_id"
              label="Subdomain"
              rules={[{ required: true, message: 'Please select a subdomain' }]}
            >
              <Select placeholder="Select a subdomain">
                {subdomains.map(subdomain => (
                  <Select.Option key={subdomain.id} value={subdomain.id}>
                    {subdomain.name} ({subdomain.domain_name})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
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
                {agreementTypes.map(type => (
                  <Select.Option key={type} value={type}>
                    {type}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        );

      case 'articles':
        return (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Article Name"
              rules={[{ required: true, message: 'Please enter article name' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="category_id"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select placeholder="Select a category">
                {categories.map(category => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.name} ({category.subdomain_name})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="manufacturers"
              label="Manufacturers"
            >
              <Select
                mode="multiple"
                placeholder="Select manufacturers"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
                onChange={(selectedManufacturers) => {
                  // Update the form with reference fields for selected manufacturers
                  const currentValues = form.getFieldsValue();
                  const references = currentValues.manufacturer_references || {};
                  
                  // Remove references for unselected manufacturers
                  Object.keys(references).forEach(manufacturerId => {
                    if (!selectedManufacturers.includes(manufacturerId)) {
                      delete references[manufacturerId];
                    }
                  });
                  
                  form.setFieldsValue({ manufacturer_references: references });
                }}
              >
                {manufacturers.length > 0 ? (
                  manufacturers.map(manufacturer => (
                    <Select.Option key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </Select.Option>
                  ))
                ) : (
                  <Select.Option value="" disabled>No manufacturers available</Select.Option>
                )}
              </Select>
            </Form.Item>
            
            <Form.Item
              noStyle
              shouldUpdate
            >
              {({ getFieldValue }) => {
                const selectedManufacturers = getFieldValue('manufacturers') || [];
                return selectedManufacturers.length > 0 ? (
                  <div style={{ marginTop: '16px' }}>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                      Manufacturer References (Optional)
                    </Text>
                    {selectedManufacturers.map((manufacturerId: string) => {
                      const manufacturer = manufacturers.find(m => m.id === manufacturerId);
                      return (
                        <Form.Item
                          key={manufacturerId}
                          name={['manufacturer_references', manufacturerId]}
                          label={`Reference for ${manufacturer?.name}`}
                          style={{ marginBottom: '8px' }}
                        >
                          <Input placeholder="Enter reference number" />
                        </Form.Item>
                      );
                    })}
                  </div>
                ) : null;
              }}
            </Form.Item>
          </Form>
        );

      case 'manufacturers':
        return (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Manufacturer Name"
              rules={[{ required: true, message: 'Please enter manufacturer name' }]}
            >
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
            <Form.Item name="is_supplier" label="Is Supplier" valuePropName="checked">
              <Select>
                <Select.Option value={true}>Yes</Select.Option>
                <Select.Option value={false}>No</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        );



      case 'contractors':
        return (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Contractor Name"
              rules={[{ required: true, message: 'Please enter contractor name' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="sigle" label="Sigle">
              <Input />
            </Form.Item>
            <Form.Item name="address" label="Address">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="phone" label="Phone">
              <Input />
            </Form.Item>
            <Form.Item name="fax" label="Fax">
              <Input />
            </Form.Item>
            <Form.Item name="country" label="Country">
              <Input />
            </Form.Item>
          </Form>
        );

      case 'contractor_agreements':
        return (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="contractor_id"
              label="Contractor"
              rules={[{ required: true, message: 'Please select a contractor' }]}
            >
              <Select placeholder="Select a contractor">
                {contractors.map(contractor => (
                  <Select.Option key={contractor.id} value={contractor.id}>
                    {contractor.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="type"
              label="Agreement Type"
              rules={[{ required: true, message: 'Please enter agreement type' }]}
            >
              <Input placeholder="e.g., public, private, partnership" />
            </Form.Item>
            <Form.Item name="date_start" label="Start Date">
              <Input type="date" />
            </Form.Item>
            <Form.Item name="date_end" label="End Date">
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="subdomain_id"
              label="Subdomain"
              rules={[{ required: true, message: 'Please select a subdomain' }]}
            >
              <Select placeholder="Select a subdomain">
                {subdomains.map(subdomain => (
                  <Select.Option key={subdomain.id} value={subdomain.id}>
                    {subdomain.name} ({subdomain.domain_name})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        );

      case 'category_agreements':
        return (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="category_id"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select placeholder="Select a category">
                {categories.map(category => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.name} ({category.subdomain_name})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="agreement_type"
              label="Agreement Type"
              rules={[{ required: true, message: 'Please enter agreement type' }]}
            >
              <Input placeholder="e.g., public, private, partnership" />
            </Form.Item>
          </Form>
        );

      default:
        return null;
    }
  };

  const domainColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Domain) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this domain?"
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
    },
  ];

  const subdomainColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Domain', dataIndex: 'domain_name', key: 'domain_name' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Subdomain) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this subdomain?"
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
    },
  ];

  const categoryColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Subdomain', dataIndex: 'subdomain_name', key: 'subdomain_name' },
    { 
      title: 'Agreement Types', 
      key: 'agreement_types',
      render: (_: any, record: Category) => {
        const agreements = categoryAgreements
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
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Category) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this category?"
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
    },
  ];

  const articleColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category_name', key: 'category_name' },
    { title: 'Subdomain', dataIndex: 'subdomain_name', key: 'subdomain_name' },
    { title: 'Domain', dataIndex: 'domain_name', key: 'domain_name' },
    { 
      title: 'Manufacturers', 
      key: 'manufacturers',
      render: (_: any, record: Article) => (
        <div>
          {record.manufacturers && record.manufacturers.length > 0 ? (
            record.manufacturers.map((manufacturer: ArticleManufacturerInfo) => (
              <div key={manufacturer.id} style={{ marginBottom: '4px' }}>
                <Tag color="blue">{manufacturer.manufacturer_name}</Tag>
                {manufacturer.reference && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Ref: {manufacturer.reference}
                  </Text>
                )}
                {manufacturer.certified_by_onee && (
                  <Tag color="green" style={{ marginLeft: '4px' }}>ONEE Certified</Tag>
                )}
              </div>
            ))
          ) : (
            <Text type="secondary">No manufacturers</Text>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Article) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this article?"
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
    },
  ];

  const manufacturerColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
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
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Manufacturer) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this manufacturer?"
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
    },
  ];



  const contractorColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Sigle', dataIndex: 'sigle', key: 'sigle' },
    { title: 'Country', dataIndex: 'country', key: 'country' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Contractor) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this contractor?"
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
    },
  ];

  const contractorAgreementColumns = [
    { title: 'Contractor', dataIndex: 'contractor_name', key: 'contractor_name' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Subdomain', dataIndex: 'subdomain_name', key: 'subdomain_name' },
    { title: 'Domain', dataIndex: 'domain_name', key: 'domain_name' },
    { title: 'Start Date', dataIndex: 'date_start', key: 'date_start' },
    { title: 'End Date', dataIndex: 'date_end', key: 'date_end' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ContractorAgreement) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this contractor agreement?"
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
    },
  ];

  const categoryAgreementColumns = [
    { title: 'Category', dataIndex: 'category_name', key: 'category_name' },
    { title: 'Subdomain', dataIndex: 'subdomain_name', key: 'subdomain_name' },
    { title: 'Domain', dataIndex: 'domain_name', key: 'domain_name' },
    { title: 'Agreement Type', dataIndex: 'agreement_type', key: 'agreement_type' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CategoryAgreement) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this category agreement?"
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
    },
  ];

  const tabItems = [
    {
      key: 'domains',
      label: 'Domains',
      children: (
        <>
          <div style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Domain
            </Button>
          </div>
          <Table
            columns={domainColumns}
            dataSource={domains}
            rowKey="id"
            loading={loading}
          />
        </>
      ),
    },
    {
      key: 'subdomains',
      label: 'Subdomains',
      children: (
        <>
          <div style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Subdomain
            </Button>
          </div>
          <Table
            columns={subdomainColumns}
            dataSource={subdomains}
            rowKey="id"
            loading={loading}
          />
        </>
      ),
    },
    {
      key: 'categories',
      label: 'Categories',
      children: (
        <>
          <div style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Category
            </Button>
          </div>
          <Table
            columns={categoryColumns}
            dataSource={categories}
            rowKey="id"
            loading={loading}
          />
        </>
      ),
    },
    {
      key: 'articles',
      label: 'Articles',
      children: (
        <>
          <div style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Article
            </Button>
          </div>
          <Table
            columns={articleColumns}
            dataSource={articles}
            rowKey="id"
            loading={loading}
          />
        </>
      ),
    },
    {
      key: 'manufacturers',
      label: 'Manufacturers',
      children: (
        <>
          <div style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Manufacturer
            </Button>
          </div>
          <Table
            columns={manufacturerColumns}
            dataSource={manufacturers}
            rowKey="id"
            loading={loading}
          />
        </>
      ),
    },

    {
      key: 'contractors',
      label: 'Contractors',
      children: (
        <>
          <div style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Contractor
            </Button>
          </div>
          <Table
            columns={contractorColumns}
            dataSource={contractors}
            rowKey="id"
            loading={loading}
          />
        </>
      ),
    },
    {
      key: 'contractor_agreements',
      label: 'Contractor Agreements',
      children: (
        <>
          <div style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Contractor Agreement
            </Button>
          </div>
          <Table
            columns={contractorAgreementColumns}
            dataSource={contractorAgreements}
            rowKey="id"
            loading={loading}
          />
        </>
      ),
    },
    {
      key: 'category_agreements',
      label: 'Category Agreements',
      children: (
        <>
          <div style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Category Agreement
            </Button>
          </div>
          <Table
            columns={categoryAgreementColumns}
            dataSource={categoryAgreements}
            rowKey="id"
            loading={loading}
          />
        </>
      ),
    },
  ];

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

        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={4}>
            <Card>
              <Statistic
                title="Domains"
                value={domains.length}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Subdomains"
                value={subdomains.length}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Categories"
                value={categories.length}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Articles"
                value={articles.length}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Manufacturers"
                value={manufacturers.length}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Contractors"
                value={contractors.length}
                prefix={<DatabaseOutlined />}
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
          title={modalTitle}
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