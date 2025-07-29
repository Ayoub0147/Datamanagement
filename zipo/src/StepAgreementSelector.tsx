import React, { useEffect, useState } from 'react';
import { Radio, Button, Spin, Typography, message } from 'antd';
import { supabase } from './supabaseClient';

const { Title } = Typography;

interface StepAgreementSelectorProps {
  selectedSubdomainId: string;
  onNext: (agreementType: string) => void;
}

const StepAgreementSelector: React.FC<StepAgreementSelectorProps> = ({
  selectedSubdomainId,
  onNext,
}) => {
  const [agreements, setAgreements] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgreements = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('contractor_agreements')
        .select('type')
        .eq('subdomain_id', selectedSubdomainId);

      if (error) {
        message.error('Failed to fetch agreement types');
        setLoading(false);
        return;
      }

      const uniqueTypes = Array.from(new Set(data.map((row: any) => row.type)));
      setAgreements(uniqueTypes);
      setLoading(false);
    };

    if (selectedSubdomainId) {
      fetchAgreements();
    }
  }, [selectedSubdomainId]);

  const handleNext = () => {
    if (!selected) {
      message.warning('Please select an agreement type.');
      return;
    }
    onNext(selected);
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <Title level={4}>Select Agreement Type</Title>
      {loading ? (
        <Spin />
      ) : agreements.length === 0 ? (
        <Typography.Text type="secondary">
          No agreement types found for this subdomain.
        </Typography.Text>
      ) : (
        <Radio.Group
          onChange={e => setSelected(e.target.value)}
          value={selected}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: 24,
          }}
        >
          {agreements.map(type => (
            <Radio.Button key={type} value={type} style={{ textAlign: 'left' }}>
              {type}
            </Radio.Button>
          ))}
        </Radio.Group>
      )}
      <Button
        type="primary"
        onClick={handleNext}
        disabled={!selected}
        style={{ marginTop: 16 }}
      >
        Next
      </Button>
    </div>
  );
};

export default StepAgreementSelector;
