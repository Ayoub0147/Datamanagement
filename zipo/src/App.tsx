import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography, Space, Button } from 'antd';
import { 
  AppstoreOutlined, 
  SearchOutlined, 
  DatabaseOutlined, 
  FileTextOutlined,
  ProjectOutlined,
  TeamOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined
} from '@ant-design/icons';
import Dashboard from './Dashboard';
import ProductSearch from './ProductSearch';
import ManufacturerSearch from './ManufacturerSearch';
import ContractorSearch from './ContractorSearch';
import ContractorInfo from './ContractorInfo';
import ProjectCreationWizard from './ProjectCreationWizard';
import CompletedProjects from './CompletedProjects';
import DataManagement from './DataManagement';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  let selectedKey = '1';
  if (location.pathname === '/') selectedKey = '1';
  else if (location.pathname.startsWith('/products')) selectedKey = '2';
  else if (location.pathname.startsWith('/manufacturers')) selectedKey = '3';
  else if (location.pathname.startsWith('/contractors')) selectedKey = '4';
  else if (location.pathname.startsWith('/projects/create')) selectedKey = '5';
  else if (location.pathname.startsWith('/projects/completed')) selectedKey = '6';
  else if (location.pathname.startsWith('/data-management')) selectedKey = '7';

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case '1':
        navigate('/');
        break;
      case '2':
        navigate('/products');
        break;
      case '3':
        navigate('/manufacturers');
        break;
      case '4':
        navigate('/contractors');
        break;
      case '5':
        navigate('/projects/create');
        break;
      case '6':
        navigate('/projects/completed');
        break;
      case '7':
        navigate('/data-management');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <Layout style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Side Menu */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={true}
        style={{
          background: '#282828',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          zIndex: 1001
        }}
        width={280}
      >
        {/* Logo Area */}
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 0,
          borderBottom: '1px solid #404040',
          background: '#282828'
        }}>
          <div style={{
            background: '#ff4d4f',
            padding: 8,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 0
          }}>
            <AppstoreOutlined style={{ fontSize: 18, color: '#fff' }} />
          </div>
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          style={{ 
            borderRight: 'none',
            background: '#282828',
            marginTop: 8
          }}
          items={[
            { 
              key: '1', 
              icon: <HomeOutlined style={{ fontSize: 16 }} />, 
              label: 'Dashboard'
            },
            { 
              key: '2', 
              icon: <SearchOutlined style={{ fontSize: 16 }} />, 
              label: 'Product Search'
            },
            { 
              key: '3', 
              icon: <DatabaseOutlined style={{ fontSize: 16 }} />, 
              label: 'Manufacturers'
            },
            { 
              key: '4', 
              icon: <TeamOutlined style={{ fontSize: 16 }} />, 
              label: 'Contractors'
            },
            { 
              key: '5', 
              icon: <ProjectOutlined style={{ fontSize: 16 }} />, 
              label: 'Create Project'
            },
            { 
              key: '6', 
              icon: <FileTextOutlined style={{ fontSize: 16 }} />, 
              label: 'Completed Projects'
            },
            { 
              key: '7', 
              icon: <DatabaseOutlined style={{ fontSize: 16 }} />, 
              label: 'Data Management'
            }
          ]}
        />

        {/* Bottom Section */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 20px',
          borderTop: '1px solid #404040',
          background: '#282828'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {/* Icons removed */}
            </div>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#1890ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600
            }}>
              U
            </div>
          </div>
        </div>
      </Sider>

      <Layout>
        {/* Top Header */}
        <Header style={{ 
          background: '#ffffff', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          height: 64
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#666', fontSize: 14 }}>Project:</span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: '#f8f9fa',
                borderRadius: 6,
                border: '1px solid #e8e8e8',
                cursor: 'pointer'
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ff4d4f'
                }}></div>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#262626' }}>
                  {selectedKey === '1' && 'Dashboard'}
                  {selectedKey === '2' && 'Product Search'}
                  {selectedKey === '3' && 'Manufacturers'}
                  {selectedKey === '4' && 'Contractors'}
                  {selectedKey === '5' && 'Create Project'}
                  {selectedKey === '6' && 'Completed Projects'}
                  {selectedKey === '7' && 'Data Management'}
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              icon={<span style={{ fontSize: 16 }}>↻</span>}
              style={{ width: 40, height: 40, borderRadius: 6 }}
            />
            <Button
              type="text"
              icon={<span style={{ fontSize: 16 }}>⬇️</span>}
              style={{ width: 40, height: 40, borderRadius: 6 }}
            />
            <Button
              type="text"
              icon={<span style={{ fontSize: 16 }}>👤</span>}
              style={{ width: 40, height: 40, borderRadius: 6 }}
            />
          </div>
        </Header>

        {/* Main Content */}
        <Content style={{ 
          padding: '24px',
          minHeight: 'calc(100vh - 64px)',
          background: '#f8f9fa'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            overflow: 'hidden',
            minHeight: 'calc(100vh - 112px)'
          }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<ProductSearch />} />
              <Route path="/manufacturers" element={<ManufacturerSearch />} />
              <Route path="/contractors" element={<ContractorSearch />} />
              <Route path="/contractors/:id" element={<ContractorInfo />} />
              <Route path="/projects/create" element={<ProjectCreationWizard />} />
              <Route path="/projects/completed" element={<CompletedProjects />} />
              <Route path="/data-management" element={<DataManagement />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </div>
        </Content>

        {/* Footer */}
        <Footer style={{ 
          textAlign: 'center', 
          background: '#ffffff', 
          color: '#8c8c8c', 
          fontSize: 12,
          padding: '12px 24px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <div style={{ marginBottom: 2 }}>
            © {new Date().getFullYear()} Product Catalog Management System
          </div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>
            Powered by Supabase & Ant Design • Built with React & TypeScript
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
}

export default function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}
