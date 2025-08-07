import React, { useEffect, useState } from 'react';
import { Card, Typography, Row, Col, Statistic, Progress, Table, Tag, Spin } from 'antd';
import { 
  ProjectOutlined, 
  DatabaseOutlined, 
  TeamOutlined, 
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const { Title, Text } = Typography;

interface DashboardStats {
  totalProjects: number;
  contractorProjects: number;
  supplierProjects: number;
  totalEquipment: number;
  totalManufacturers: number;
  totalContractors: number;
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
  activeContractorProjects: number;
  activeSupplierProjects: number;
  completedContractorProjects: number;
  completedSupplierProjects: number;
  totalCategories: number;
  totalSubdomains: number;
  totalDomains: number;
  recentProjects: any[];
  topManufacturers: any[];
  topContractors: any[];
  projectTrends: any[];
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all statistics in parallel
      const [
        projectsData,
        equipmentData,
        manufacturersData,
        contractorsData,
        categoriesData,
        subdomainsData,
        domainsData,
        recentProjectsData,
        topManufacturersData,
        topContractorsData
      ] = await Promise.all([
        // Projects statistics
        supabase.from('completed_projects_view').select('*'),
        
        // Equipment statistics
        supabase.from('project_equipment').select('*'),
        
        // Manufacturers statistics
        supabase.from('manufacturers').select('*'),
        
        // Contractors statistics
        supabase.from('contractors').select('*'),
        
        // Categories statistics
        supabase.from('categories').select('*'),
        
        // Subdomains statistics
        supabase.from('subdomains').select('*'),
        
        // Domains statistics
        supabase.from('domains').select('*'),
        
        // Recent projects
        supabase.from('completed_projects_view')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Top manufacturers by equipment count
        supabase.from('project_equipment')
          .select(`
            manufacturers (
              id,
              name,
              contact
            )
          `)
          .not('manufacturers', 'is', null),
        
        // Top contractors by project count
        supabase.from('completed_projects_view')
          .select('contractor_name, contractor_sigle, project_type')
          .eq('project_type', 'contractor')
      ]);

      // Process the data
      const projects = projectsData.data || [];
      const equipment = equipmentData.data || [];
      const manufacturers = manufacturersData.data || [];
      const contractors = contractorsData.data || [];
      const categories = categoriesData.data || [];
      const subdomains = subdomainsData.data || [];
      const domains = domainsData.data || [];
      const recentProjects = recentProjectsData.data || [];
      
      // Separate projects by type
      const contractorProjects = projects.filter(p => p.project_type === 'contractor');
      const supplierProjects = projects.filter(p => p.project_type === 'supplier');
      
      // Calculate manufacturer statistics
      const manufacturerCounts: { [key: string]: number } = {};
      topManufacturersData.data?.forEach((item: any) => {
        if (item.manufacturers?.name) {
          manufacturerCounts[item.manufacturers.name] = (manufacturerCounts[item.manufacturers.name] || 0) + 1;
        }
      });
      
      // Calculate contractor statistics (only for contractor projects)
      const contractorCounts: { [key: string]: number } = {};
      topContractorsData.data?.forEach((item: any) => {
        if (item.contractor_name) {
          contractorCounts[item.contractor_name] = (contractorCounts[item.contractor_name] || 0) + 1;
        }
      });

      const dashboardStats: DashboardStats = {
        totalProjects: projects.length,
        contractorProjects: contractorProjects.length,
        supplierProjects: supplierProjects.length,
        totalEquipment: equipment.length,
        totalManufacturers: manufacturers.length,
        totalContractors: contractors.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        pendingProjects: projects.filter(p => p.status === 'pending').length,
        activeContractorProjects: contractorProjects.filter(p => p.status === 'active').length,
        activeSupplierProjects: supplierProjects.filter(p => p.status === 'active').length,
        completedContractorProjects: contractorProjects.filter(p => p.status === 'completed').length,
        completedSupplierProjects: supplierProjects.filter(p => p.status === 'completed').length,
        totalCategories: categories.length,
        totalSubdomains: subdomains.length,
        totalDomains: domains.length,
        recentProjects: recentProjects,
        topManufacturers: Object.entries(manufacturerCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        topContractors: Object.entries(contractorCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        projectTrends: projects.map(p => ({
          month: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          count: 1
        }))
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text type="secondary">No data available</Text>
      </div>
    );
  }

  const recentProjectsColumns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: record.project_type === 'contractor' 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12
          }}>
            {record.project_type === 'contractor' ? <TeamOutlined /> : <SettingOutlined />}
          </div>
          <div style={{ fontWeight: 500, color: '#262626' }}>{text}</div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'project_type',
      key: 'project_type',
      render: (type: string) => (
        <Tag 
          color={type === 'contractor' ? 'purple' : 'blue'} 
          style={{ borderRadius: 4 }}
        >
          {type === 'contractor' ? 'Contractor' : 'Supplier'}
        </Tag>
      ),
    },
    {
      title: 'Domain',
      dataIndex: 'domain_name',
      key: 'domain_name',
      render: (text: string) => (
        <Tag color="blue" style={{ borderRadius: 4 }}>{text}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag 
          color={status === 'active' ? 'green' : status === 'completed' ? 'blue' : 'orange'}
          style={{ borderRadius: 4 }}
        >
          {status === 'active' ? '🟢 Active' : status === 'completed' ? '🔵 Completed' : '🟡 Pending'}
        </Tag>
      ),
    },
  ];

  const topManufacturersColumns = [
    {
      title: 'Manufacturer',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div style={{ fontWeight: 500, color: '#262626' }}>{text}</div>
      ),
    },
    {
      title: 'Equipment Count',
      dataIndex: 'count',
      key: 'count',
      render: (value: number) => (
        <div style={{ fontWeight: 600, color: '#52c41a' }}>{value}</div>
      ),
    },
  ];

  const topContractorsColumns = [
    {
      title: 'Contractor',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div style={{ fontWeight: 500, color: '#262626' }}>{text}</div>
      ),
    },
    {
      title: 'Project Count',
      dataIndex: 'count',
      key: 'count',
      render: (value: number) => (
        <div style={{ fontWeight: 600, color: '#faad14' }}>{value}</div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: '#262626', margin: 0, fontSize: 24 }}>
          Dashboard
        </Title>
        <div style={{ color: '#666', marginTop: 4, fontSize: 14 }}>
          Overview of your project management system
        </div>
      </div>

      {/* Main Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="Total Projects"
              value={stats.totalProjects}
              prefix={<ProjectOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: 24, fontWeight: 600 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {stats.activeProjects} active • {stats.completedProjects} completed
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="Contractor Projects"
              value={stats.contractorProjects}
              prefix={<TeamOutlined style={{ color: '#667eea' }} />}
              valueStyle={{ color: '#667eea', fontSize: 24, fontWeight: 600 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {stats.activeContractorProjects} active • {stats.completedContractorProjects} completed
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="Supplier Projects"
              value={stats.supplierProjects}
              prefix={<SettingOutlined style={{ color: '#4facfe' }} />}
              valueStyle={{ color: '#4facfe', fontSize: 24, fontWeight: 600 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {stats.activeSupplierProjects} active • {stats.completedSupplierProjects} completed
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="Total Equipment"
              value={stats.totalEquipment}
              prefix={<DatabaseOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 24, fontWeight: 600 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Across {stats.totalCategories} categories
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Additional Statistics Row */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="Manufacturers"
              value={stats.totalManufacturers}
              prefix={<TeamOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 24, fontWeight: 600 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {stats.topManufacturers.length > 0 ? `${stats.topManufacturers[0].count} top supplier` : 'No suppliers yet'}
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="Contractors"
              value={stats.totalContractors}
              prefix={<FileTextOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d', fontSize: 24, fontWeight: 600 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {stats.topContractors.length > 0 ? `${stats.topContractors[0].count} top contractor` : 'No contractors yet'}
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="System Domains"
              value={stats.totalDomains}
              prefix={<ProjectOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: 24, fontWeight: 600 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {stats.totalSubdomains} subdomains • {stats.totalCategories} categories
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Progress Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card 
            title="Project Status Overview" 
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Active Projects</Text>
                <Text strong>{stats.activeProjects}</Text>
              </div>
              <Progress 
                percent={stats.totalProjects > 0 ? (stats.activeProjects / stats.totalProjects) * 100 : 0} 
                strokeColor="#52c41a"
                showInfo={false}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Completed Projects</Text>
                <Text strong>{stats.completedProjects}</Text>
              </div>
              <Progress 
                percent={stats.totalProjects > 0 ? (stats.completedProjects / stats.totalProjects) * 100 : 0} 
                strokeColor="#1890ff"
                showInfo={false}
              />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Pending Projects</Text>
                <Text strong>{stats.pendingProjects}</Text>
              </div>
              <Progress 
                percent={stats.totalProjects > 0 ? (stats.pendingProjects / stats.totalProjects) * 100 : 0} 
                strokeColor="#faad14"
                showInfo={false}
              />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card 
            title="Project Type Breakdown" 
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#667eea' }}>Contractor Projects</Text>
                <Text strong style={{ color: '#667eea' }}>{stats.contractorProjects}</Text>
              </div>
              <Progress 
                percent={stats.totalProjects > 0 ? (stats.contractorProjects / stats.totalProjects) * 100 : 0} 
                strokeColor="#667eea"
                showInfo={false}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#4facfe' }}>Supplier Projects</Text>
                <Text strong style={{ color: '#4facfe' }}>{stats.supplierProjects}</Text>
              </div>
              <Progress 
                percent={stats.totalProjects > 0 ? (stats.supplierProjects / stats.totalProjects) * 100 : 0} 
                strokeColor="#4facfe"
                showInfo={false}
              />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Equipment Total</Text>
                <Text strong>{stats.totalEquipment}</Text>
              </div>
              <Progress 
                percent={100} 
                strokeColor="#52c41a"
                showInfo={false}
              />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card 
            title="Quick Actions" 
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div 
                style={{ 
                  padding: '12px', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  borderRadius: 8, 
                  border: '1px solid #b7eb8f',
                  cursor: 'pointer',
                  color: 'white'
                }}
                onClick={() => navigate('/projects/create')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircleOutlined />
                  <Text strong style={{ color: 'white' }}>Create New Project</Text>
                </div>
              </div>
              
              <div 
                style={{ 
                  padding: '12px', 
                  background: '#e6f7ff', 
                  borderRadius: 8, 
                  border: '1px solid #91d5ff',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/projects/completed')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClockCircleOutlined style={{ color: '#1890ff' }} />
                  <Text strong style={{ color: '#1890ff' }}>View All Projects</Text>
                </div>
              </div>
              
              <div 
                style={{ 
                  padding: '12px', 
                  background: '#f6ffed', 
                  borderRadius: 8, 
                  border: '1px solid #b7eb8f',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/data-management')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DatabaseOutlined style={{ color: '#52c41a' }} />
                  <Text strong style={{ color: '#52c41a' }}>Manage Data</Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tables Section */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card 
            title="Recent Projects" 
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Table
              columns={recentProjectsColumns}
              dataSource={stats.recentProjects}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title="Top Manufacturers" 
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Table
              columns={topManufacturersColumns}
              dataSource={stats.topManufacturers}
              rowKey="name"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 