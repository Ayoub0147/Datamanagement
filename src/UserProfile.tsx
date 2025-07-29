import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Avatar, Divider, Row, Col, Descriptions, Tag } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useAuth } from './AuthContext';

const { Title, Text } = Typography;

const UserProfile: React.FC = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const userData = user?.user_metadata || {};

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      const { error } = await updateProfile({
        full_name: values.fullName,
        role: values.role,
        organization: values.organization,
      });
      
      if (error) {
        message.error(error.message);
      } else {
        message.success('Profile updated successfully!');
        setEditing(false);
      }
    } catch (error) {
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (values: any) => {
    setPasswordLoading(true);
    try {
      const { error } = await updatePassword(values.newPassword);
      
      if (error) {
        message.error(error.message);
      } else {
        message.success('Password updated successfully!');
        passwordForm.resetFields();
      }
    } catch (error) {
      message.error('An unexpected error occurred');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: 24, color: '#262626' }}>
        User Profile
      </Title>

      <Row gutter={24}>
        {/* Profile Information */}
        <Col xs={24} lg={16}>
          <Card
            title="Profile Information"
            extra={
              !editing ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    icon={<SaveOutlined />}
                    type="primary"
                    loading={loading}
                    onClick={() => form.submit()}
                  >
                    Save
                  </Button>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setEditing(false);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )
            }
            style={{ marginBottom: 24, borderRadius: 12 }}
          >
            {!editing ? (
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Full Name">
                  <Text strong>{userData.full_name || 'Not set'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  <Text>{user?.email}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Role">
                  <Tag color="blue">{userData.role || 'Not set'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Organization">
                  <Text>{userData.organization || 'Not set'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Member Since">
                  <Text>{new Date(user?.created_at || '').toLocaleDateString()}</Text>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  fullName: userData.full_name || '',
                  role: userData.role || '',
                  organization: userData.organization || '',
                }}
                onFinish={handleProfileUpdate}
              >
                <Form.Item
                  name="fullName"
                  label="Full Name"
                  rules={[{ required: true, message: 'Please enter your full name!' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Enter your full name" />
                </Form.Item>

                <Form.Item
                  name="role"
                  label="Role"
                  rules={[{ required: true, message: 'Please select your role!' }]}
                >
                  <Input placeholder="Enter your role" />
                </Form.Item>

                <Form.Item
                  name="organization"
                  label="Organization"
                  rules={[{ required: true, message: 'Please enter your organization!' }]}
                >
                  <Input placeholder="Enter your organization" />
                </Form.Item>
              </Form>
            )}
          </Card>

          {/* Change Password */}
          <Card
            title="Change Password"
            style={{ borderRadius: 12 }}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordUpdate}
            >
              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter a new password!' },
                  { min: 8, message: 'Password must be at least 8 characters!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter new password"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Confirm new password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={passwordLoading}
                  icon={<LockOutlined />}
                >
                  Update Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* User Avatar and Quick Info */}
        <Col xs={24} lg={8}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Avatar
              size={120}
              style={{
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                marginBottom: 16,
                fontSize: 48,
                fontWeight: 'bold'
              }}
            >
              {userData.full_name ? getInitials(userData.full_name) : 'U'}
            </Avatar>
            
            <Title level={3} style={{ margin: '0 0 8px 0' }}>
              {userData.full_name || 'User'}
            </Title>
            
            <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
              {userData.role || 'User Role'}
            </Text>
            
            <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
              Active Account
            </Tag>
            
            <Divider />
            
            <div style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary">Email:</Text>
                <br />
                <Text strong>{user?.email}</Text>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary">Organization:</Text>
                <br />
                <Text strong>{userData.organization || 'Not set'}</Text>
              </div>
              
              <div>
                <Text type="secondary">Member Since:</Text>
                <br />
                <Text strong>{new Date(user?.created_at || '').toLocaleDateString()}</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserProfile; 