import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, Button, message, Tag, Space, Modal, Spin } from 'antd';
import { EyeOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase } from './supabaseClient';
import jsPDF from 'jspdf';

const { Title } = Typography;

interface CompletedProject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  status: string;
  domain_name: string;
  subdomain_name: string;
  agreement_type: string;
  contractor_name: string;
  contractor_sigle: string;
  contractor_address: string;
  contractor_phone: string;
  contractor_fax: string;
  contractor_country: string;
  total_equipment: number;
  assigned_suppliers: number;
  unique_suppliers: number;
  categories_covered: number;
}

const CompletedProjects: React.FC = () => {
  const [projects, setProjects] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<CompletedProject | null>(null);
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('completed_projects_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        message.error('Failed to fetch projects');
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    try {
      setDetailsLoading(true);
      
      // Fetch project equipment details
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('project_equipment')
        .select(`
          *,
          articles (
            id,
            name,
            categories (
              name
            )
          ),
          manufacturers (
            id,
            name,
            contact,
            phone,
            email
          )
        `)
        .eq('project_id', projectId);

      if (equipmentError) {
        console.error('Error fetching project details:', equipmentError);
        message.error('Failed to fetch project details');
        return;
      }

      setProjectDetails(equipmentData);
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to fetch project details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDetails = async (project: CompletedProject) => {
    setSelectedProject(project);
    setDetailsModalVisible(true);
    await fetchProjectDetails(project.id);
  };

  const handleGeneratePDF = (project: CompletedProject) => {
    try {
      const doc = new jsPDF();
      let y = 10;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      
      // Header
      doc.setFillColor(24, 144, 255);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('PROJECT DETAILS REPORT', pageWidth / 2, 17, { align: 'center' });
      
      y = 35;
      
      // Project Information
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('PROJECT INFORMATION', margin, y);
      y += 12;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      const projectInfo = [
        { label: 'Project Name:', value: project.name },
        { label: 'Created Date:', value: new Date(project.created_at).toLocaleDateString() },
        { label: 'Domain:', value: project.domain_name },
        { label: 'Subdomain:', value: project.subdomain_name },
        { label: 'Agreement Type:', value: project.agreement_type },
        { label: 'Status:', value: project.status },
      ];
      
      projectInfo.forEach(info => {
        doc.setFont(undefined, 'bold');
        doc.text(info.label, margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(info.value, margin + 50, y);
        y += 8;
      });
      
      y += 10;
      
      // Contractor Information
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('CONTRACTOR INFORMATION', margin, y);
      y += 12;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      const contractorInfo = [
        { label: 'Name:', value: project.contractor_name },
        { label: 'Sigle:', value: project.contractor_sigle },
        { label: 'Address:', value: project.contractor_address },
        { label: 'Phone:', value: project.contractor_phone },
        { label: 'Fax:', value: project.contractor_fax },
        { label: 'Country:', value: project.contractor_country },
      ];
      
      contractorInfo.forEach(info => {
        doc.setFont(undefined, 'bold');
        doc.text(info.label, margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(info.value, margin + 50, y);
        y += 8;
      });
      
      y += 10;
      
      // Project Statistics
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('PROJECT STATISTICS', margin, y);
      y += 12;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      const stats = [
        { label: 'Total Equipment:', value: project.total_equipment.toString() },
        { label: 'Assigned Suppliers:', value: project.assigned_suppliers.toString() },
        { label: 'Unique Suppliers:', value: project.unique_suppliers.toString() },
        { label: 'Categories Covered:', value: project.categories_covered.toString() },
      ];
      
      stats.forEach(stat => {
        doc.setFont(undefined, 'bold');
        doc.text(stat.label, margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(stat.value, margin + 80, y);
        y += 8;
      });
      
      // Equipment Details
      if (projectDetails && projectDetails.length > 0) {
        y += 10;
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('EQUIPMENT DETAILS', margin, y);
        y += 12;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        projectDetails.forEach((item: any, index: number) => {
          doc.text(`${index + 1}. ${item.articles?.name || 'Unknown'}`, margin, y);
          y += 6;
          doc.text(`   Category: ${item.articles?.categories?.name || 'N/A'}`, margin + 10, y);
          y += 6;
          doc.text(`   Supplier: ${item.manufacturers?.name || 'Not assigned'}`, margin + 10, y);
          y += 6;
          doc.text(`   Reference: ${item.reference || 'N/A'}`, margin + 10, y);
          y += 6;
          doc.text(`   Certified: ${item.certified_by_onee ? 'Yes' : 'No'}`, margin + 10, y);
          y += 8;
          
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
        });
      }
      
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 280);
      
      const fileName = `project-${project.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      message.success('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate PDF');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    Modal.confirm({
      title: 'Delete Project',
      content: 'Are you sure you want to delete this project? This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

          if (error) {
            console.error('Error deleting project:', error);
            message.error('Failed to delete project');
            return;
          }

          message.success('Project deleted successfully');
          fetchProjects();
        } catch (error) {
          console.error('Error:', error);
          message.error('Failed to delete project');
        }
      },
    });
  };

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) {
        console.error('Error updating project status:', error);
        message.error('Failed to update project status');
        return;
      }

      message.success(`Project status updated to ${newStatus}`);
      fetchProjects(); // Refresh the projects list
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to update project status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'completed':
        return 'blue';
      case 'pending':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'completed':
        return '✅';
      case 'pending':
        return '⏳';
      default:
        return '⚪';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'active';
      case 'active':
        return 'completed';
      case 'completed':
        return 'pending';
      default:
        return 'pending';
    }
  };

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CompletedProject) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 'bold'
          }}>
            {text.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
              Created: {new Date(record.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Domain/Subdomain',
      key: 'domain',
      render: (record: CompletedProject) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: '#f0f0f0',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 12,
            color: '#666'
          }}>
            {record.domain_name}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>→</div>
          <div style={{
            background: '#e6f7ff',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 12,
            color: '#1890ff'
          }}>
            {record.subdomain_name}
          </div>
        </div>
      ),
    },
    {
      title: 'Contractor',
      dataIndex: 'contractor_name',
      key: 'contractor_name',
      render: (text: string, record: CompletedProject) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: '#f6ffed',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 12,
            color: '#52c41a'
          }}>
            👷
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.contractor_sigle}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Agreement Type',
      dataIndex: 'agreement_type',
      key: 'agreement_type',
      render: (text: string) => (
        <div style={{
          background: '#fff7e6',
          borderRadius: 6,
          padding: '4px 8px',
          fontSize: 12,
          color: '#fa8c16',
          textAlign: 'center',
          fontWeight: 500
        }}>
          {text}
        </div>
      ),
    },
    {
      title: 'Equipment',
      key: 'equipment',
      render: (record: CompletedProject) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: '#1890ff',
            marginBottom: 4
          }}>
            {record.total_equipment}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.assigned_suppliers} assigned
          </div>
          <div style={{ 
            width: '100%', 
            height: 4, 
            background: '#f0f0f0', 
            borderRadius: 2,
            marginTop: 4
          }}>
            <div style={{
              width: `${record.total_equipment > 0 ? (record.assigned_suppliers / record.total_equipment) * 100 : 0}%`,
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2
            }} />
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: CompletedProject) => (
        <Tag 
          color={getStatusColor(status)}
          style={{ 
            borderRadius: 6,
            fontWeight: 500,
            padding: '4px 8px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={() => handleStatusChange(record.id, getNextStatus(status))}
        >
          {getStatusIcon(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: CompletedProject) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 6
            }}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleGeneratePDF(record)}
            style={{
              borderRadius: 6,
              border: '1px solid #d9d9d9'
            }}
          >
            PDF
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProject(record.id)}
            style={{
              borderRadius: 6
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: 24
      }}>
        <Title level={2} style={{ color: '#262626', margin: 0, fontSize: 24 }}>
          Reports
        </Title>
        <div style={{ color: '#666', marginTop: 4, fontSize: 14 }}>
          View and manage all your completed projects
        </div>
      </div>

      <Card style={{ 
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0',
        overflow: 'hidden'
      }}>
        {/* Stats Summary */}
        <div style={{ 
          background: '#fafafa', 
          padding: '24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 24
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#1890ff', marginBottom: 4 }}>
              {projects.length}
            </div>
            <div style={{ color: '#666', fontSize: 13 }}>Total Projects</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#52c41a', marginBottom: 4 }}>
              {projects.reduce((sum, p) => sum + p.total_equipment, 0)}
            </div>
            <div style={{ color: '#666', fontSize: 13 }}>Total Equipment</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#faad14', marginBottom: 4 }}>
              {projects.reduce((sum, p) => sum + p.unique_suppliers, 0)}
            </div>
            <div style={{ color: '#666', fontSize: 13 }}>Unique Suppliers</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#f5222d', marginBottom: 4 }}>
              {projects.filter(p => p.status === 'active').length}
            </div>
            <div style={{ color: '#666', fontSize: 13 }}>Active Projects</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#1890ff', marginBottom: 4 }}>
              {projects.filter(p => p.status === 'completed').length}
            </div>
            <div style={{ color: '#666', fontSize: 13 }}>Completed Projects</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#fa8c16', marginBottom: 4 }}>
              {projects.filter(p => p.status === 'pending').length}
            </div>
            <div style={{ color: '#666', fontSize: 13 }}>Pending Projects</div>
          </div>
        </div>
        
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} projects`,
          }}
          style={{ padding: '0 24px' }}
        />
      </Card>

      {/* Project Details Modal */}
      <Modal
        title="Project Details"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedProject && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h3>Project Information</h3>
              <p><strong>Name:</strong> {selectedProject.name}</p>
              <p><strong>Domain:</strong> {selectedProject.domain_name}</p>
              <p><strong>Subdomain:</strong> {selectedProject.subdomain_name}</p>
              <p><strong>Agreement Type:</strong> {selectedProject.agreement_type}</p>
              <p><strong>Created:</strong> {new Date(selectedProject.created_at).toLocaleString()}</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3>Contractor Information</h3>
              <p><strong>Name:</strong> {selectedProject.contractor_name}</p>
              <p><strong>Sigle:</strong> {selectedProject.contractor_sigle}</p>
              <p><strong>Address:</strong> {selectedProject.contractor_address}</p>
              <p><strong>Phone:</strong> {selectedProject.contractor_phone}</p>
              <p><strong>Fax:</strong> {selectedProject.contractor_fax}</p>
              <p><strong>Country:</strong> {selectedProject.contractor_country}</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3>Project Statistics</h3>
              <p><strong>Total Equipment:</strong> {selectedProject.total_equipment}</p>
              <p><strong>Assigned Suppliers:</strong> {selectedProject.assigned_suppliers}</p>
              <p><strong>Unique Suppliers:</strong> {selectedProject.unique_suppliers}</p>
              <p><strong>Categories Covered:</strong> {selectedProject.categories_covered}</p>
            </div>

            {detailsLoading ? (
              <Spin />
            ) : projectDetails && projectDetails.length > 0 ? (
              <div>
                <h3>Equipment Details</h3>
                <Table
                  dataSource={projectDetails}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: 'Equipment',
                      dataIndex: ['articles', 'name'],
                      key: 'equipment',
                    },
                    {
                      title: 'Category',
                      dataIndex: ['articles', 'categories', 'name'],
                      key: 'category',
                    },
                    {
                      title: 'Supplier',
                      dataIndex: ['manufacturers', 'name'],
                      key: 'supplier',
                    },
                    {
                      title: 'Reference',
                      dataIndex: 'reference',
                      key: 'reference',
                    },
                    {
                      title: 'Certified',
                      dataIndex: 'certified_by_onee',
                      key: 'certified',
                      render: (certified: boolean) => (
                        <Tag color={certified ? 'green' : 'orange'}>
                          {certified ? 'Yes' : 'No'}
                        </Tag>
                      ),
                    },
                  ]}
                />
              </div>
            ) : (
              <p>No equipment details available</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CompletedProjects; 