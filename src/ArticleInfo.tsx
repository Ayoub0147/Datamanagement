import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Spin, Button, Descriptions, Empty, Table, Tag, Space, Badge } from 'antd';
import { supabase } from './supabaseClient';
import { ArrowLeftOutlined, FileTextOutlined, BuildOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface Article {
  id: string;
  name: string;
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

const ArticleInfo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      console.log('Fetching article with ID:', id);
      
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          name,
          category_id,
          categories(
            name,
            subdomains(
              name,
              domains(name)
            )
          ),
          article_manufacturer(
            id,
            manufacturer_id,
            certified_by_onee,
            manufacturers(name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching article:', error);
        setLoading(false);
        return;
      }

      console.log('Raw article data:', data);
      console.log('Raw article data type:', typeof data);
      console.log('Is data null?', data === null);
      console.log('Is data undefined?', data === undefined);
      if (data) {
        console.log('Raw article data keys:', Object.keys(data));
        console.log('Data.id:', data.id);
        console.log('Data.name:', data.name);
        console.log('Data.categories:', data.categories);
        console.log('Data.article_manufacturer:', data.article_manufacturer);
      }

      if (data) {
        const articleData = {
          id: data.id,
          name: data.name,
          category_id: data.category_id,
          category_name: data.categories?.[0]?.name || '',
          subdomain_name: data.categories?.[0]?.subdomains?.[0]?.name || '',
          domain_name: data.categories?.[0]?.subdomains?.[0]?.domains?.[0]?.name || '',
          manufacturers: data.article_manufacturer?.map((am: any) => ({
            id: am.id,
            manufacturer_id: am.manufacturer_id,
            manufacturer_name: am.manufacturers?.[0]?.name || '',
            certified_by_onee: am.certified_by_onee
          })) || []
        };
        
        console.log('Processed article data:', articleData);
        console.log('Article name:', articleData.name);
        console.log('Article category:', articleData.category_name);
        console.log('Article subdomain:', articleData.subdomain_name);
        console.log('Article domain:', articleData.domain_name);
        console.log('Article manufacturers:', articleData.manufacturers);
        console.log('Manufacturers length:', articleData.manufacturers?.length);
        setArticle(articleData);
      }
      setLoading(false);
    };

    fetchArticle();
  }, [id]);

  console.log('Current article state:', article);
  console.log('Loading state:', loading);
  console.log('Article name in state:', article?.name);
  console.log('Article category in state:', article?.category_name);
  
  if (loading) return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;
  if (!article) return (
    <div style={{ padding: '24px' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/data-management')} 
        style={{ marginBottom: 24 }}
      >
        Back to Data Management
      </Button>
      <Typography.Text type="danger">Article not found. ID: {id}</Typography.Text>
    </div>
  );

  const manufacturerColumns = [
    {
      title: 'Manufacturer',
      dataIndex: 'manufacturer_name',
      key: 'manufacturer_name',
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>
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
    }
  ];

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
            <FileTextOutlined style={{ marginRight: '8px' }} />
            Article Information
          </Typography.Title>
        </div>

        {/* Article Details */}
        <Card title="Article Details" style={{ marginBottom: 24 }}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="Name" span={2}>
              <Typography.Text strong>{article.name}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Category">
              <Typography.Text>{article.category_name}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Subdomain">
              <Typography.Text>{article.subdomain_name}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Domain" span={2}>
              <Tag color="blue">{article.domain_name}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Manufacturers */}
        <Card 
          title={
            <Space>
              <BuildOutlined />
              Linked Manufacturers
              <Badge count={article.manufacturers?.length || 0} showZero />
            </Space>
          }
        >
          <Table
            columns={manufacturerColumns}
            dataSource={article.manufacturers || []}
            rowKey="id"
            pagination={false}
            locale={{ 
              emptyText: (
                <Empty 
                  description="No manufacturers linked to this article" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) 
            }}
          />
        </Card>
      </Card>
    </div>
  );
};

export default ArticleInfo; 