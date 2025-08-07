import React from 'react';
import { Card, Typography, Button, Row, Col } from 'antd';
import { 
  TeamOutlined, 
  SettingOutlined,
  ArrowRightOutlined 
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface StepProjectTypeSelectorProps {
  onNext: (projectType: 'contractor' | 'supplier') => void;
}

const StepProjectTypeSelector: React.FC<StepProjectTypeSelectorProps> = ({ onNext }) => {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '32px',
        marginBottom: 32,
        color: 'white',
        textAlign: 'center',
        borderRadius: 12
      }}>
        <Title level={2} style={{ color: 'white', margin: 0, marginBottom: 8 }}>
          Choose Project Type
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, margin: 0 }}>
          Select the type of project you want to create
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card
            hoverable
            style={{
              height: '100%',
              borderRadius: 12,
              border: '2px solid #f0f0f0',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={() => onNext('contractor')}
            bodyStyle={{ 
              padding: 32, 
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                width: 80,
                height: 80,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
              }}>
                <TeamOutlined style={{ fontSize: 36, color: 'white' }} />
              </div>
              
              <Title level={3} style={{ marginBottom: 16, color: '#262626' }}>
                Contractor Project
              </Title>
              
              <Paragraph style={{ 
                color: '#666', 
                fontSize: 16, 
                lineHeight: 1.6,
                marginBottom: 24 
              }}>
                Create a project focused on contractor selection and management. 
                This type is ideal for construction, installation, or service-based projects.
              </Paragraph>

              <div style={{ 
                background: '#f8f9fa', 
                padding: 16, 
                borderRadius: 8,
                marginBottom: 24,
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#1890ff' }}>
                  Includes:
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
                  <li>Agreement type selection</li>
                  <li>Contractor selection and details</li>
                  <li>Project summary and PDF generation</li>
                </ul>
              </div>
            </div>

            <Button 
              type="primary" 
              size="large"
              icon={<ArrowRightOutlined />}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 8,
                height: 48,
                fontSize: 16,
                fontWeight: 600
              }}
            >
              Select Contractor Project
            </Button>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            hoverable
            style={{
              height: '100%',
              borderRadius: 12,
              border: '2px solid #f0f0f0',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={() => onNext('supplier')}
            bodyStyle={{ 
              padding: 32, 
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                width: 80,
                height: 80,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)'
              }}>
                <SettingOutlined style={{ fontSize: 36, color: 'white' }} />
              </div>
              
              <Title level={3} style={{ marginBottom: 16, color: '#262626' }}>
                Supplier/Equipment Project
              </Title>
              
              <Paragraph style={{ 
                color: '#666', 
                fontSize: 16, 
                lineHeight: 1.6,
                marginBottom: 24 
              }}>
                Create a project focused on equipment selection and supplier management. 
                This type is ideal for procurement, equipment installation, or supply chain projects.
              </Paragraph>

              <div style={{ 
                background: '#f8f9fa', 
                padding: 16, 
                borderRadius: 8,
                marginBottom: 24,
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#1890ff' }}>
                  Includes:
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
                  <li>Agreement type selection</li>
                  <li>Equipment selection and supplier assignment</li>
                  <li>Project summary and PDF generation</li>
                </ul>
              </div>
            </div>

            <Button 
              type="primary" 
              size="large"
              icon={<ArrowRightOutlined />}
              style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                border: 'none',
                borderRadius: 8,
                height: 48,
                fontSize: 16,
                fontWeight: 600
              }}
            >
              Select Supplier Project
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StepProjectTypeSelector;