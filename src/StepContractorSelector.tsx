import React, { useEffect, useState } from 'react';
import { Checkbox, Button, Spin, Typography, message, Card, List, Collapse, Input } from 'antd';
import { supabase } from './supabaseClient';

const { Title } = Typography;
const { Panel } = Collapse;

interface StepContractorSelectorProps {
  agreementType: string;
  onNext: (contractors: any[]) => void;
}

const PAGE_SIZE = 6;

const StepContractorSelector: React.FC<StepContractorSelectorProps> = ({ agreementType, onNext }) => {
  const [contractors, setContractors] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractorInfos, setContractorInfos] = useState<{ [id: string]: any }>({});
  const [agreements, setAgreements] = useState<{ [id: string]: any[] }>({});
  const [loadingInfo, setLoadingInfo] = useState<{ [id: string]: boolean }>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchContractors = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('contractor_agreements')
        .select('contractor_id, contractors(name, sigle)')
        .ilike('type', `%${agreementType}%`);
      if (error) {
        message.error('Failed to fetch contractors');
        setLoading(false);
        return;
      }
      // Unique contractors by id
      const unique: { [id: string]: any } = {};
      (data || []).forEach((row: any) => {
        if (row.contractor_id && row.contractors) {
          unique[row.contractor_id] = { id: row.contractor_id, ...row.contractors };
        }
      });
      setContractors(Object.values(unique));
      setLoading(false);
      setPage(1); // Reset to first page on new data
    };
    if (agreementType) {
      fetchContractors();
    }
  }, [agreementType]);

  const fetchContractorInfo = async (id: string) => {
    setLoadingInfo(prev => ({ ...prev, [id]: true }));
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('*')
      .eq('id', id)
      .single();
    const { data: agreementsData, error: agreementsError } = await supabase
      .from('contractor_agreements')
      .select('*')
      .eq('contractor_id', id)
      .order('date_start', { ascending: false });
    if (!contractorError) {
      setContractorInfos(prev => ({ ...prev, [id]: contractor }));
    }
    if (!agreementsError) {
      setAgreements(prev => ({ ...prev, [id]: agreementsData || [] }));
    }
    setLoadingInfo(prev => ({ ...prev, [id]: false }));
  };

  const handleCollapseChange = (activeKeys: string | string[]) => {
    const keys = Array.isArray(activeKeys) ? activeKeys : [activeKeys];
    keys.forEach(id => {
      if (!contractorInfos[id]) {
        fetchContractorInfo(id);
      }
    });
  };

  const handleNext = () => {
    const selectedContractors = contractors.filter(c => selected.includes(c.id));
    if (selectedContractors.length === 0) {
      message.warning('Please select at least one contractor.');
      return;
    }
    onNext(selectedContractors);
  };

  // Filtering and pagination
  const filtered = contractors.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.sigle.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (delta: number) => {
    setPage(p => Math.max(1, Math.min(totalPages, p + delta)));
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={4}>Select Contractor(s)</Title>
      <Input.Search
        placeholder="Search by name or sigle"
        allowClear
        style={{ maxWidth: 400, marginBottom: 16 }}
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
      />
      {loading ? (
        <Spin />
      ) : filtered.length === 0 ? (
        <Typography.Text type="secondary">No contractors found for this agreement type.</Typography.Text>
      ) : (
        <>
          <Checkbox.Group
            value={selected}
            onChange={vals => setSelected(vals as string[])}
            style={{ display: 'block', marginBottom: 24 }}
          >
            <Collapse accordion onChange={handleCollapseChange} style={{ background: '#fafcff', borderRadius: 8 }}>
              {paged.map(contractor => (
                <Panel
                  header={
                    <Checkbox value={contractor.id} style={{ fontWeight: 500 }}>
                      {contractor.name} ({contractor.sigle})
                    </Checkbox>
                  }
                  key={contractor.id}
                >
                  {loadingInfo[contractor.id] ? (
                    <Spin />
                  ) : contractorInfos[contractor.id] ? (
                    <Card bordered={false} style={{ background: 'inherit' }}>
                      <p><b>Address:</b> {contractorInfos[contractor.id].address}</p>
                      <p><b>Phone:</b> {contractorInfos[contractor.id].phone}</p>
                      <p><b>Fax:</b> {contractorInfos[contractor.id].fax}</p>
                      <p><b>Country:</b> {contractorInfos[contractor.id].country}</p>
                      <List
                        header={<b>Agreements</b>}
                        bordered
                        dataSource={agreements[contractor.id]}
                        renderItem={item => (
                          <List.Item>
                            <b>{item.type}</b> | {item.date_start} - {item.date_end}
                          </List.Item>
                        )}
                        locale={{ emptyText: 'No agreements found.' }}
                        style={{ marginTop: 16, background: '#fff', borderRadius: 8 }}
                      />
                    </Card>
                  ) : null}
                </Panel>
              ))}
            </Collapse>
          </Checkbox.Group>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Button onClick={() => handlePageChange(-1)} disabled={page === 1}>Previous</Button>
            <span>Page {page} of {totalPages}</span>
            <Button onClick={() => handlePageChange(1)} disabled={page === totalPages}>Next</Button>
          </div>
        </>
      )}
      <Button type="primary" onClick={handleNext} disabled={selected.length === 0} style={{ marginTop: 16 }}>
        Next
      </Button>
    </div>
  );
};

export default StepContractorSelector; 