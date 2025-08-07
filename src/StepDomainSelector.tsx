import React, { useEffect, useState } from 'react';
import { Select, Radio, Button, Spin, Typography, message } from 'antd';
import { supabase } from './supabaseClient';

const { Title } = Typography;

interface Domain {
  id: string;
  name: string;
}

interface Subdomain {
  id: string;
  name: string;
  domain_id: string;
  domain?: {
    id: string;
    name: string;
  };
}

interface StepDomainSelectorProps {
  onNext: (subdomain: Subdomain) => void;
}

const StepDomainSelector: React.FC<StepDomainSelectorProps> = ({ onNext }) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState<string | null>(null);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingSubdomains, setLoadingSubdomains] = useState(false);

  useEffect(() => {
    const fetchDomains = async () => {
      setLoadingDomains(true);
      const { data, error } = await supabase.from('domains').select('*').order('name');
      if (error) {
        message.error('Failed to fetch domains');
        setLoadingDomains(false);
        return;
      }
      setDomains(data || []);
      setLoadingDomains(false);
    };
    fetchDomains();
  }, []);

  useEffect(() => {
    if (!selectedDomain) {
      setSubdomains([]);
      setSelectedSubdomain(null);
      return;
    }
    const fetchSubdomains = async () => {
      setLoadingSubdomains(true);
      const { data, error } = await supabase
        .from('subdomains')
        .select('*')
        .eq('domain_id', selectedDomain)
        .order('name');
      if (error) {
        message.error('Failed to fetch subdomains');
        setLoadingSubdomains(false);
        return;
      }
      setSubdomains(data || []);
      setSelectedSubdomain(null);
      setLoadingSubdomains(false);
    };
    fetchSubdomains();
  }, [selectedDomain]);

  const handleNext = () => {
    const sub = subdomains.find(s => s.id === selectedSubdomain);
    const domain = domains.find(d => d.id === selectedDomain);
    if (!sub) {
      message.warning('Please select a subdomain.');
      return;
    }
    onNext({ ...sub, domain });
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <Title level={4}>Select Domain</Title>
      {loadingDomains ? (
        <Spin />
      ) : (
        <Select
          style={{ width: '100%', marginBottom: 24 }}
          placeholder="Select a domain"
          value={selectedDomain}
          onChange={val => setSelectedDomain(val)}
          options={domains.map(d => ({ value: d.id, label: d.name }))}
        />
      )}
      {selectedDomain && (
        <>
          <Title level={5} style={{ marginTop: 16 }}>Select Subdomain</Title>
          {loadingSubdomains ? (
            <Spin />
          ) : (
            <Radio.Group
              onChange={e => setSelectedSubdomain(e.target.value)}
              value={selectedSubdomain}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}
            >
              {subdomains.map(sub => (
                <Radio.Button key={sub.id} value={sub.id} style={{ textAlign: 'left' }}>
                  {sub.name}
                </Radio.Button>
              ))}
            </Radio.Group>
          )}
          <Button type="primary" onClick={handleNext} disabled={!selectedSubdomain}>
            Next
          </Button>
        </>
      )}
    </div>
  );
};

export default StepDomainSelector; 