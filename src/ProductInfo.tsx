import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Typography, List, Spin, Button, Descriptions, Empty } from 'antd';
import { supabase } from './supabaseClient';
import { ArrowLeftOutlined } from '@ant-design/icons';

const ProductInfo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id, name, category:categories(name),
          article_manufacturer:article_manufacturer(
            manufacturer:manufacturers(id, name, contact, phone, email),
            reference, certified_by_onee
          )
        `)
        .eq('id', id)
        .single();
      setProduct(data);
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;
  if (!product) return <Typography.Text type="danger">Product not found.</Typography.Text>;

  // Group manufacturers by reference
  const manufacturersByReference: Record<string, any[]> = {};
  (product.article_manufacturer || []).forEach((am: any) => {
    const ref = am.reference || 'No Reference';
    if (!manufacturersByReference[ref]) manufacturersByReference[ref] = [];
    manufacturersByReference[ref].push(am);
  });

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')} style={{ marginBottom: 24 }}>
        Back to Product Search
      </Button>
      <Typography.Title level={2}>Product Information</Typography.Title>
      <Card style={{ marginBottom: 24 }}>
        <Descriptions title={product.name} bordered column={1} size="middle">
          <Descriptions.Item label="Category">{product.category?.name}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Typography.Title level={4}>Manufacturers by Reference</Typography.Title>
      {Object.keys(manufacturersByReference).length === 0 ? (
        <Empty description="No manufacturers found." />
      ) : (
        Object.entries(manufacturersByReference).map(([reference, mans]) => (
          <Card key={reference} title={`Reference: ${reference}`} style={{ marginBottom: 16 }}>
            <List
              bordered
              dataSource={mans}
              renderItem={(am: any) => (
                <List.Item>
                  <Link to={`/manufacturers/${am.manufacturer?.id}`}><b>{am.manufacturer?.name}</b></Link> {am.certified_by_onee ? '[ONEE]' : ''}<br />
                  Contact: {am.manufacturer?.contact || '-'} | Phone: {am.manufacturer?.phone || '-'} | Email: {am.manufacturer?.email || '-'}
                </List.Item>
              )}
              locale={{ emptyText: <Empty description="No manufacturers for this reference." /> }}
              style={{ background: '#fafcff', borderRadius: 8 }}
            />
          </Card>
        ))
      )}
    </div>
  );
};

export default ProductInfo; 