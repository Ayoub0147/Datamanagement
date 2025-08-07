import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, List, Spin, Button, Descriptions, Empty } from 'antd';
import { supabase } from './supabaseClient';
import { HomeOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, FileTextOutlined } from '@ant-design/icons';

interface Contractor {
  id: string;
  name: string;
  sigle: string;
  address: string;
  phone: string;
  fax: string;
  country: string;
}

interface Agreement {
  id: string;
  contractor_id: string;
  type: string;
  date_start: string;
  date_end: string;
}

function formatDate(date: string) {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
}

const ContractorInfo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', id)
        .single();
      setContractor(contractorData);
      const { data: agreementsData } = await supabase
        .from('contractor_agreements')
        .select('*')
        .eq('contractor_id', id)
        .order('date_start', { ascending: false });
      setAgreements(agreementsData || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;
  if (!contractor) return <Typography.Text type="danger">Contractor not found.</Typography.Text>;

  return (
    <div>
      <Button icon={<HomeOutlined />} onClick={() => navigate('/contractors')} style={{ marginBottom: 24 }}>
        Back to Contractor Search
      </Button>
      <Typography.Title level={2}>Contractor Information</Typography.Title>
      <Card style={{ marginBottom: 24 }}>
        <Descriptions title={contractor.name + ' (' + contractor.sigle + ')'} bordered column={1} size="middle">
          <Descriptions.Item label={<span><EnvironmentOutlined /> Address</span>}>{contractor.address}</Descriptions.Item>
          <Descriptions.Item label={<span><PhoneOutlined /> Phone</span>}>{contractor.phone}</Descriptions.Item>
          <Descriptions.Item label={<span><MailOutlined /> Fax</span>}>{contractor.fax}</Descriptions.Item>
          <Descriptions.Item label={<span>Country</span>}>{contractor.country}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Typography.Title level={4}><FileTextOutlined /> Agreements</Typography.Title>
      <List
        bordered
        dataSource={agreements}
        renderItem={item => (
          <List.Item>
            <b>{item.type}</b> | {formatDate(item.date_start)} - {formatDate(item.date_end)}
          </List.Item>
        )}
        locale={{ emptyText: <Empty description="No agreements found." /> }}
        style={{ background: '#fafcff', borderRadius: 8 }}
      />
    </div>
  );
};

export default ContractorInfo; 