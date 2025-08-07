import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, List, Spin, Button, Descriptions, Empty, Tag, Space, Badge } from 'antd';
import { supabase } from './supabaseClient';
import { 
  ArrowLeftOutlined, 
  BuildOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

interface Manufacturer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  is_supplier: boolean;
}

interface Article {
  id: string;
  name: string;
  category_name: string;
  subdomain_name: string;
  domain_name: string;
  certified_by_onee: boolean;
}

const ManufacturerInfo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manufacturer, setManufacturer] = useState<Manufacturer | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching manufacturer with ID:', id);
      
      // Fetch manufacturer data
      const { data: manufacturerData, error: manufacturerError } = await supabase
        .from('manufacturers')
        .select('*')
        .eq('id', id)
        .single();

      if (manufacturerError) {
        console.error('Error fetching manufacturer:', manufacturerError);
        setLoading(false);
        return;
      }

      setManufacturer(manufacturerData);

      // Fetch linked articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('article_manufacturer')
        .select(`
          id,
          certified_by_onee,
          articles(
            id,
            name,
            categories(
              name,
              subdomains(
                name,
                domains(name)
              )
            )
          )
        `)
        .eq('manufacturer_id', id);

      if (articlesError) {
        console.error('Error fetching articles:', articlesError);
        setLoading(false);
        return;
      }

      console.log('Raw articles data:', articlesData);

      if (articlesData) {
        const processedArticles = articlesData.map((am: any) => ({
          id: am.articles?.id || '',
          name: am.articles?.name || '',
          category_name: am.articles?.categories?.[0]?.name || '',
          subdomain_name: am.articles?.categories?.[0]?.subdomains?.[0]?.name || '',
          domain_name: am.articles?.categories?.[0]?.subdomains?.[0]?.domains?.[0]?.name || '',
          certified_by_onee: am.certified_by_onee
        }));

        console.log('Processed articles:', processedArticles);
        setArticles(processedArticles);
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;
  if (!manufacturer) return (
    <div style={{ padding: '24px' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/data-management')} 
        style={{ marginBottom: 24 }}
      >
        Back to Data Management
      </Button>
      <Typography.Text type="danger">Manufacturer not found. ID: {id}</Typography.Text>
    </div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/data-management')} 
        style={{ marginBottom: 24 }}
      >
        Back to Data Management
      </Button>
      
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Typography.Title level={2}>
            <BuildOutlined style={{ marginRight: '8px' }} />
            Manufacturer Information
          </Typography.Title>
        </div>

        {/* Manufacturer Details */}
        <Card title="Manufacturer Details" style={{ marginBottom: 24 }}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="Name" span={2}>
              <Typography.Text strong>{manufacturer.name}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Contact">
              <Typography.Text>{manufacturer.contact || 'N/A'}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              <Typography.Text>{manufacturer.phone || 'N/A'}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Email" span={2}>
              <Typography.Text>{manufacturer.email || 'N/A'}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Supplier Status" span={2}>
              <Tag color={manufacturer.is_supplier ? 'green' : 'red'}>
                {manufacturer.is_supplier ? 'Yes' : 'No'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Linked Articles */}
        <Card 
          title={
            <Space>
              <FileTextOutlined />
              Linked Articles
              <Badge count={articles.length} showZero />
            </Space>
          }
        >
          <List
            bordered
            dataSource={articles}
            renderItem={item => (
              <List.Item>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Typography.Text strong>{item.name}</Typography.Text>
                      <br />
                      <Space size="small" style={{ marginTop: 4 }}>
                        <Tag color="blue">{item.domain_name}</Tag>
                        <Typography.Text type="secondary">{item.subdomain_name}</Typography.Text>
                        <Typography.Text type="secondary">• {item.category_name}</Typography.Text>
                      </Space>
                    </div>
                    <div>
                      <Tag 
                        color={item.certified_by_onee ? 'green' : 'red'}
                        icon={item.certified_by_onee ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                      >
                        {item.certified_by_onee ? 'ONEE Certified' : 'Not Certified'}
                      </Tag>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
            locale={{ 
              emptyText: (
                <Empty 
                  description="No articles linked to this manufacturer" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) 
            }}
            style={{ background: '#fafcff', borderRadius: 8 }}
          />
        </Card>
      </Card>
    </div>
  );
};

export default ManufacturerInfo; 