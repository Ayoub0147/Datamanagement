import React, { useState } from 'react';
import { Steps, Card, Typography, Button, message } from 'antd';
import StepDomainSelector from './StepDomainSelector';

const { Title } = Typography;

const steps = [
  {
    title: 'Domain/Subdomain',
    content: 'Select domain and subdomain',
  },
  {
    title: 'Project Details',
    content: 'Review selected information',
  },
];

const ProjectCreation: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [selectedSubdomain, setSelectedSubdomain] = useState<any>(null);

  const handleDomainNext = (subdomain: any) => {
    if (!subdomain || !subdomain.name || !subdomain.domain?.name) {
      message.error('Invalid subdomain selection');
      return;
    }
    setSelectedSubdomain(subdomain);
    setCurrent(1);
    message.success(`Selected: ${subdomain.domain.name} / ${subdomain.name}`);
  };

  return (
    <Card style={{ maxWidth: 600, margin: '40px auto', borderRadius: 12 }}>
      <Title level={2}>Create New Project</Title>
      <Steps current={current} style={{ marginBottom: 32 }}>
        {steps.map(step => (
          <Steps.Step key={step.title} title={step.title} />
        ))}
      </Steps>

      {current === 0 && (
        <StepDomainSelector onNext={handleDomainNext} />
      )}

      {current === 1 && (
        <div>
          <Title level={4}>Project Details (Preview)</Title>
          <p><b>Domain:</b> {selectedSubdomain?.domain?.name}</p>
          <p><b>Subdomain:</b> {selectedSubdomain?.name}</p>
          <Button onClick={() => setCurrent(0)} style={{ marginTop: 24 }}>
            Back
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ProjectCreation;
