import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      const { error } = await resetPassword(values.email);
      if (error) {
        message.error(error.message);
      } else {
        setEmailSent(true);
        message.success('Password reset email sent! Please check your inbox.');
      }
    } catch (error) {
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%), url('/auth-background.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Card
          style={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: 'none'
          }}
          bodyStyle={{ padding: '40px', textAlign: 'center' }}
        >
          <div style={{
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 16px rgba(82, 196, 26, 0.3)'
          }}>
            <MailOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          
          <Title level={2} style={{ margin: '0 0 16px 0', color: '#262626' }}>
            Check Your Email
          </Title>
          
          <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 24 }}>
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
          </Text>
          
          <Button
            type="primary"
            onClick={() => navigate('/login')}
            style={{
              height: 48,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
              border: 'none',
              fontSize: 16,
              fontWeight: 600
            }}
          >
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%), url('/auth-background.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: 'none'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        {/* Logo and Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 16px rgba(250, 173, 20, 0.3)'
          }}>
            <MailOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <Title level={2} style={{ margin: 0, color: '#262626', fontSize: 28 }}>
            Forgot Password?
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Enter your email to receive a reset link
          </Text>
        </div>

        {/* Reset Form */}
        <Form
          name="forgotPassword"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Email address"
              style={{ borderRadius: 8, height: 48 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                border: 'none',
                fontSize: 16,
                fontWeight: 600
              }}
            >
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>

        {/* Links */}
        <div style={{ textAlign: 'center' }}>
          <Divider style={{ margin: '16px 0' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>OR</Text>
          </Divider>
          
          <Link to="/login" style={{ 
            color: '#1890ff', 
            textDecoration: 'none', 
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}>
            <ArrowLeftOutlined />
            Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword; 