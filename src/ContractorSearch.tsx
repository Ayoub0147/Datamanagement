import React, { useEffect, useState } from 'react';
import {
  Typography,
  Input,
  Table,
  Avatar,
  Spin,
  message,
  Select,
  DatePicker,
  Row,
  Col
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import dayjs, { Dayjs } from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface Contractor {
  id: string;
  name: string;
  sigle: string;
  address: string;
  phone: string;
  fax: string;
  country: string;
  contractor_agreements: {
    id: string;
    type: string;
    date_start: string;
    date_end: string;
  }[];
}

const ContractorSearch: React.FC = () => {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [filtered, setFiltered] = useState<Contractor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [agreementType, setAgreementType] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  useEffect(() => {
    const fetchContractors = async () => {
      const { data, error } = await supabase
        .from('contractors')
        .select(`
          id,
          name,
          sigle,
          address,
          phone,
          fax,
          country,
          contractor_agreements (
            id,
            type,
            date_start,
            date_end
          )
        `)
        .order('name');

      if (error) {
        message.error(error.message);
        return;
      }

      setContractors(data || []);
      setLoading(false);
    };

    fetchContractors();
  }, []);

  useEffect(() => {
    const lower = search.toLowerCase();

    const result = contractors.filter((c) => {
      const nameMatch =
        c.name.toLowerCase().includes(lower) ||
        c.sigle.toLowerCase().includes(lower);

      const agreementMatch = agreementType
        ? c.contractor_agreements.some((a) => a.type === agreementType)
        : true;

      const dateMatch = dateRange
        ? c.contractor_agreements.some((a) => {
            const d = dayjs(a.date_start);
            return d.isAfter(dateRange[0]) && d.isBefore(dateRange[1]);
          })
        : true;

      return nameMatch && agreementMatch && dateMatch;
    });

    setFiltered(result);
  }, [search, contractors, agreementType, dateRange]);

  const columns = [
    {
      title: '',
      dataIndex: 'id',
      key: 'avatar',
      render: () => <Avatar icon={<UserOutlined />} />
    },
    {
      title: 'Name',
      dataIndex: 'name',
      render: (text: string, record: Contractor) => (
        <Link to={`/contractors/${record.id}`}>{text}</Link>
      )
    },
    {
      title: 'Sigle',
      dataIndex: 'sigle'
    },
    {
      title: 'Country',
      dataIndex: 'country'
    },
    {
      title: 'Phone',
      dataIndex: 'phone'
    }
  ];

  const allAgreementTypes = Array.from(
    new Set(
      contractors.flatMap((c) =>
        c.contractor_agreements.map((a) => a.type)
      )
    )
  ).filter(Boolean);

  return (
    <div>
      <Title level={2}>Contractor Search</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col>
          <Input.Search
            placeholder="Search by name or sigle"
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
          />
        </Col>
        <Col>
          <Select
            placeholder="Filter by agreement type"
            allowClear
            style={{ width: 200 }}
            value={agreementType}
            onChange={(val) => setAgreementType(val)}
            options={allAgreementTypes.map((t) => ({ value: t, label: t }))}
          />
        </Col>
        <Col>
          <RangePicker
            allowEmpty={[true, true]}
            value={dateRange}
            onChange={(range) => setDateRange(range as [Dayjs, Dayjs])}
          />
        </Col>
      </Row>

      {loading ? (
        <Spin style={{ display: 'block', margin: '60px auto' }} />
      ) : (
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          bordered
        />
      )}
    </div>
  );
};

export default ContractorSearch;
