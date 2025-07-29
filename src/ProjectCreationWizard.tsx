import React, { useState, useEffect } from 'react';
import { Steps, Card, Typography, Button, message, Select, Spin, Progress } from 'antd';
import { 
  CheckOutlined, 
  DownloadOutlined, 
  ArrowLeftOutlined, 
  ArrowRightOutlined,
  ProjectOutlined,
  TeamOutlined,
  SettingOutlined,
  FileTextOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import StepDomainSelector from './StepDomainSelector';
import StepProjectTypeSelector from './StepProjectTypeSelector';
import StepAgreementSelector from './StepAgreementSelector';
import StepContractorSelector from './StepContractorSelector';
import StepEquipmentSelector from './StepEquipmentSelector';
import { supabase } from './supabaseClient';
import jsPDF from 'jspdf';

const { Title } = Typography;

type ManufacturerOption = {
  value: string;
  label: string;
  reference: string;
  certified_by_onee?: boolean;
  manufacturer?: {
    contact?: string;
    phone?: string;
    email?: string;
    name?: string;
  };
};

const steps = [
  { 
    title: 'Domain/Subdomain', 
    content: 'Select domain and subdomain',
    icon: <ProjectOutlined />
  },
  { 
    title: 'Project Type', 
    content: 'Choose project type',
    icon: <AppstoreOutlined />
  },
  { 
    title: 'Agreement Type', 
    content: 'Select agreement type',
    icon: <FileTextOutlined />
  },
  { 
    title: 'Contractor', 
    content: 'Select contractor',
    icon: <TeamOutlined />
  },
  { 
    title: 'Equipment', 
    content: 'Select equipment',
    icon: <SettingOutlined />
  },
  { 
    title: 'Suppliers', 
    content: 'Assign suppliers to equipment',
    icon: <TeamOutlined />
  },
  { 
    title: 'Project Details', 
    content: 'Review and generate PDF',
    icon: <CheckOutlined />
  },
];

const ProjectCreationWizard: React.FC = () => {
  const [current, setCurrent] = useState<number>(0);
  const [projectType, setProjectType] = useState<'contractor' | 'supplier' | null>(null);
  const [formData, setFormData] = useState({
    subdomain: null as any,
    agreementType: null as string | null,
    contractor: null as any,
    articles: [] as any[],
    suppliers: [] as { article_id: string; manufacturer_id: string; reference: string }[],
  });
  const [manufacturerOptions, setManufacturerOptions] = useState<Record<string, ManufacturerOption[]>>({});
  const [loadingManufacturers, setLoadingManufacturers] = useState(false);

  // Function to get steps based on project type
  const getStepsForProjectType = (type: 'contractor' | 'supplier' | null) => {
    if (!type) return steps;
    
    if (type === 'contractor') {
      return [
        steps[0], // Domain/Subdomain
        steps[1], // Project Type
        steps[2], // Agreement Type
        steps[3], // Contractor
        steps[6], // Project Details
      ];
    } else {
      // Supplier projects: skip contractor step
      return [
        steps[0], // Domain/Subdomain
        steps[1], // Project Type
        steps[2], // Agreement Type
        steps[4], // Equipment (skip contractor)
        steps[5], // Suppliers
        steps[6], // Project Details
      ];
    }
  };

  const currentSteps = getStepsForProjectType(projectType);
  const totalSteps = currentSteps.length;

  // Function to map step indices for contractor projects
  const getStepIndex = (currentStep: number, type: 'contractor' | 'supplier' | null) => {
    if (type === 'contractor') {
      // Map contractor project steps: 0,1,2,3,4 (where 4 is project details)
      const contractorStepMap = [0, 1, 2, 3, 6];
      return contractorStepMap[currentStep] || currentStep;
    }
    return currentStep;
  };

  const handleDomainNext = (subdomain: any) => {
    setFormData(prev => ({ ...prev, subdomain }));
    setCurrent(1);
  };

  const handleProjectTypeNext = (type: 'contractor' | 'supplier') => {
    setProjectType(type);
    setCurrent(2);
  };

  const handleAgreementNext = (agreementType: string) => {
    setFormData(prev => ({ ...prev, agreementType }));
    
    // If this is a supplier project, skip contractor and go directly to equipment
    if (projectType === 'supplier') {
      setCurrent(3); // Go to step 3 (which will be equipment for supplier projects)
    } else {
      setCurrent(3); // Go to contractor selection for contractor projects
    }
  };

  const handleContractorNext = async (contractors: any[]) => {
    // Take the first contractor from the array and fetch complete details
    const contractor = contractors[0];
    
    if (contractor) {
      // Fetch complete contractor information
      const { data: contractorDetails, error } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', contractor.id)
        .single();
      
      if (error) {
        console.error('Error fetching contractor details:', error);
        message.error('Failed to fetch contractor details');
        return;
      }
      
      setFormData(prev => ({ ...prev, contractor: contractorDetails }));
    }
    
    // Go directly to project details for contractor projects
    setCurrent(4); // Project details step
  };

  const handleEquipmentNext = (articles: any[]) => {
    setFormData(prev => ({ ...prev, articles }));
    setCurrent(4); // Go to suppliers step (step 4 for supplier projects)
  };

  // Fetch manufacturers for each article when reaching supplier step
  useEffect(() => {
    if (current !== 4 || !formData.articles.length) return;
    setLoadingManufacturers(true);
    const options: Record<string, ManufacturerOption[]> = {};

    const fetchManufacturers = async () => {
      for (const article of formData.articles) {
        const { data: amRows, error } = await supabase
          .from('article_manufacturer')
          .select(`
            manufacturer_id,
            reference,
            certified_by_onee,
            manufacturers (
              id,
              name,
              contact,
              phone,
              email
            )
          `)
          .eq('article_id', article.id);

        if (error) {
          console.error('Error fetching manufacturers for article:', article.id, error);
          continue;
        }

        options[article.id] = [];
        (amRows || []).forEach((row: any) => {
          if (row.manufacturer_id && row.manufacturers) {
            const reference = row.reference || 'No Reference';
            if (!options[article.id]) {
              options[article.id] = [];
            }
            options[article.id].push({
              value: row.manufacturer_id,
              label: row.manufacturers.name,
              reference: row.reference || 'No Reference',
              certified_by_onee: row.certified_by_onee,
              manufacturer: row.manufacturers
            });
          }
        });
      }

      setManufacturerOptions(options);
      setLoadingManufacturers(false);
    };

    fetchManufacturers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, formData.articles]);

  const handleSupplierChange = (article_id: string, reference: string, manufacturer_id: string) => {
    setFormData(prev => ({
      ...prev,
      suppliers: [
        ...prev.suppliers.filter(s => s.article_id !== article_id),
        { article_id, manufacturer_id, reference },
      ],
    }));
  };

  const handleSuppliersNext = () => {
    if (formData.articles.some(a => !formData.suppliers.find(s => s.article_id === a.id))) {
      message.warning('Please assign a supplier to each article.');
      return;
    }
    setCurrent(5); // Go to project details step
  };

  const handleGeneratePDF = () => {
    try {
      console.log('Generating PDF...', formData);
      
      const doc = new jsPDF();
      let y = 10;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);
      
      // Header with Logo/Title
      doc.setFillColor(24, 144, 255);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('PROJECT SUMMARY REPORT', pageWidth / 2, 17, { align: 'center' });
      
      y = 35;
      
      // Project Overview Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('PROJECT OVERVIEW', margin, y);
      y += 12;
      
      // Project details in a structured format
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      const projectDetails = [
        { label: 'Project Date:', value: new Date().toLocaleDateString() },
        { label: 'Project Type:', value: projectType === 'contractor' ? 'Contractor Project' : 'Supplier/Equipment Project' },
        { label: 'Domain:', value: formData.subdomain?.domain?.name || 'N/A' },
        { label: 'Subdomain:', value: formData.subdomain?.name || 'N/A' },
        { label: 'Agreement Type:', value: formData.agreementType || 'N/A' },
      ];
      
      projectDetails.forEach(detail => {
        doc.setFont(undefined, 'bold');
        doc.text(detail.label, margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(detail.value, margin + 50, y);
        y += 8;
      });
      
      y += 10;
      
      // Contractor Information Section
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('CONTRACTOR INFORMATION', margin, y);
      y += 12;
      
      if (formData.contractor && projectType === 'contractor') {
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        const contractorDetails = [
          { label: 'Name:', value: formData.contractor.name || 'N/A' },
          { label: 'Sigle:', value: formData.contractor.sigle || 'N/A' },
          { label: 'Address:', value: formData.contractor.address || 'N/A' },
          { label: 'Phone:', value: formData.contractor.phone || 'N/A' },
          { label: 'Fax:', value: formData.contractor.fax || 'N/A' },
          { label: 'Country:', value: formData.contractor.country || 'N/A' },
        ];
        
        contractorDetails.forEach(detail => {
          doc.setFont(undefined, 'bold');
          doc.text(detail.label, margin, y);
          doc.setFont(undefined, 'normal');
          doc.text(detail.value, margin + 50, y);
          y += 8;
        });
      } else {
        doc.text('No contractor information available', margin, y);
        y += 8;
      }
      
      y += 10;
      
      // Equipment Summary Section - Only for supplier projects
      if (projectType === 'supplier') {
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('EQUIPMENT SUMMARY', margin, y);
        y += 12;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Total Equipment Items: ${formData.articles.length}`, margin, y);
        y += 8;
        doc.text(`Suppliers Assigned: ${formData.suppliers.length}`, margin, y);
        y += 15;
        
        // Equipment Table Section
        if (formData.articles.length > 0) {
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          doc.text('DETAILED EQUIPMENT & SUPPLIER ASSIGNMENTS', margin, y);
          y += 12;
          
          // Table headers
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text('No.', margin, y);
          doc.text('Equipment', margin + 15, y);
          doc.text('Category', margin + 80, y);
          doc.text('Supplier', margin + 150, y);
          doc.text('Reference', margin + 200, y);
          doc.text('ONEE', margin + 250, y);
          y += 8;
          
          // Table content
          doc.setFont(undefined, 'normal');
          formData.articles.forEach((article: any, index: number) => {
            const supplier = formData.suppliers.find(s => s.article_id === article.id);
            const supplierInfo = supplier ? 
              manufacturerOptions[article.id]?.find((opt: ManufacturerOption) => opt.value === supplier.manufacturer_id) : null;
            
            // Check if we need a new page
            if (y > 250) {
              doc.addPage();
              y = 20;
            }
            
            // Draw row background
            doc.setFillColor(248, 249, 250);
            doc.rect(margin, y - 6, contentWidth, 10, 'F');
            
            // Draw row content with better spacing
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            
            // No.
            doc.text(`${index + 1}`, margin + 2, y);
            
            // Equipment name (allow more characters)
            const equipmentName = article.name || 'N/A';
            doc.text(equipmentName.length > 30 ? equipmentName.substring(0, 27) + '...' : equipmentName, margin + 15, y);
            
            // Category name (allow more characters)
            const categoryName = article.categories?.name || 'N/A';
            doc.text(categoryName.length > 35 ? categoryName.substring(0, 32) + '...' : categoryName, margin + 80, y);
            
            // Supplier name (allow more characters)
            const supplierName = supplierInfo?.manufacturer?.name || 'N/A';
            doc.text(supplierName.length > 25 ? supplierName.substring(0, 22) + '...' : supplierName, margin + 150, y);
            
            // Reference (allow more characters)
            const reference = supplier?.reference || 'N/A';
            doc.text(reference.length > 20 ? reference.substring(0, 17) + '...' : reference, margin + 200, y);
            
            // ONEE certification
            doc.text(supplierInfo?.certified_by_onee ? 'Yes' : 'No', margin + 250, y);
            
            y += 12;
          });
        } else {
          doc.text('No equipment selected for this project', margin, y);
          y += 10;
        }
        
        y += 15;
        
        // Supplier Details Section
        if (formData.suppliers.length > 0) {
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          doc.text('SUPPLIER DETAILS', margin, y);
          y += 12;
          
          doc.setFontSize(11);
          doc.setFont(undefined, 'normal');
          
          // Get unique suppliers
          const uniqueSuppliers = new Map();
          formData.suppliers.forEach(s => {
            const supplier = manufacturerOptions[s.article_id]?.find((opt: ManufacturerOption) => opt.value === s.manufacturer_id);
            if (supplier && !uniqueSuppliers.has(s.manufacturer_id)) {
              uniqueSuppliers.set(s.manufacturer_id, supplier);
            }
          });
          
          uniqueSuppliers.forEach((supplier, supplierId) => {
            const equipmentForSupplier = formData.suppliers
              .filter(s => s.manufacturer_id === supplierId)
              .map(s => {
                const article = formData.articles.find(a => a.id === s.article_id);
                const supplierInfo = manufacturerOptions[s.article_id]?.find((opt: ManufacturerOption) => opt.value === supplierId);
                return `${article?.name || 'Unknown'} (Ref: ${supplierInfo?.reference || 'N/A'})`;
              });
            
            // Check if we need a new page
            if (y > 250) {
              doc.addPage();
              y = 20;
            }
            
            doc.setFont(undefined, 'bold');
            doc.text(`${supplier.label}:`, margin, y);
            y += 6;
            doc.setFont(undefined, 'normal');
            
            if (supplier.manufacturer) {
              doc.text(`Contact: ${supplier.manufacturer.contact || 'N/A'}`, margin + 10, y);
              y += 6;
              doc.text(`Phone: ${supplier.manufacturer.phone || 'N/A'}`, margin + 10, y);
              y += 6;
              doc.text(`Email: ${supplier.manufacturer.email || 'N/A'}`, margin + 10, y);
              y += 6;
            }
            
            doc.text(`Equipment: ${equipmentForSupplier.join(', ')}`, margin + 10, y);
            y += 8;
          });
        }
        
        y += 15;
        
        // Project Statistics
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('PROJECT STATISTICS', margin, y);
        y += 12;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        const stats = [
          { label: 'Total Equipment Items:', value: formData.articles.length.toString() },
          { label: 'Suppliers Involved:', value: new Set(formData.suppliers.map(s => s.manufacturer_id)).size.toString() },
          { label: 'Categories Covered:', value: new Set(formData.articles.map(a => a.categories?.name)).size.toString() },
          { label: 'Assignment Rate:', value: `${Math.round((formData.suppliers.length / formData.articles.length) * 100)}%` },
        ];
        
        stats.forEach(stat => {
          doc.setFont(undefined, 'bold');
          doc.text(stat.label, margin, y);
          doc.setFont(undefined, 'normal');
          doc.text(stat.value, margin + 80, y);
          y += 8;
        });
      }
      
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 280);
      
      // Save the PDF
      const fileName = `project-summary-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      message.success('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleNext = async () => {
    try {
      console.log('Saving project data:', formData);
      
      // Generate project name
      const projectName = projectType === 'contractor' 
        ? `${formData.subdomain?.domain?.name} - ${formData.subdomain?.name} - ${formData.agreementType} - ${formData.contractor?.name}`
        : `${formData.subdomain?.domain?.name} - ${formData.subdomain?.name} - ${formData.agreementType} - Equipment Project`;
      
      // Insert project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          domain_id: formData.subdomain?.domain?.id,
          subdomain_id: formData.subdomain?.id,
          agreement_type: formData.agreementType,
          contractor_id: projectType === 'contractor' ? formData.contractor?.id : null, // Only set contractor_id for contractor projects
          project_type: projectType, // Add project type to the database
          status: 'active'
        })
        .select()
        .single();

      if (projectError) {
        console.error('Error creating project:', projectError);
        message.error('Failed to create project');
        return;
      }

      // Only insert project equipment for supplier projects
      if (projectType === 'supplier' && formData.suppliers.length > 0) {
        const projectEquipmentData = formData.suppliers.map(supplier => {
          const supplierInfo = manufacturerOptions[supplier.article_id]?.find(opt => opt.value === supplier.manufacturer_id);
          return {
            project_id: project.id,
            article_id: supplier.article_id,
            manufacturer_id: supplier.manufacturer_id,
            reference: supplier.reference,
            certified_by_onee: supplierInfo?.certified_by_onee || false
          };
        });

        const { error: equipmentError } = await supabase
          .from('project_equipment')
          .insert(projectEquipmentData);

        if (equipmentError) {
          console.error('Error saving project equipment:', equipmentError);
          message.error('Project created but equipment data failed to save');
          return;
        }
      }

      message.success('Project created and saved successfully!');
      
      // Reset the form and go back to step 1
      setFormData({
        subdomain: null,
        agreementType: null,
        contractor: null,
        articles: [],
        suppliers: [],
      });
      setProjectType(null);
      setCurrent(0);
      setManufacturerOptions({});
    } catch (error) {
      console.error('Error saving project:', error);
      message.error('Failed to save project. Please try again.');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: 24
      }}>
        <Title level={2} style={{ color: '#262626', margin: 0, fontSize: 24 }}>
          Create New Project
        </Title>
        <div style={{ color: '#666', marginTop: 4, fontSize: 14 }}>
          Follow the steps below to create your project
        </div>
      </div>

      <Card style={{ 
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0',
        overflow: 'hidden'
      }}>
        {/* Progress Bar */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '32px 24px',
          borderBottom: '1px solid #f0f0f0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center', 
            gap: 20, 
            marginBottom: 16,
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '50%',
              padding: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <Progress 
                type="circle" 
                percent={Math.round(((current + 1) / totalSteps) * 100)} 
                size={70}
                strokeColor={{
                  '0%': '#667eea',
                  '100%': '#764ba2',
                }}
                trailColor="rgba(255,255,255,0.3)"
                strokeWidth={8}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '4px'
              }}>
                Step {current + 1} of {totalSteps}
              </div>
              <div style={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: 16,
                fontWeight: 500,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                {currentSteps[current]?.title}
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '24px',
          marginBottom: '24px'
        }}>
          <Steps 
            current={current} 
            style={{ 
              padding: '24px 32px',
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '16px',
              maxWidth: '100%',
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)'
            }}
          >
                      {currentSteps.map((item, idx) => (
              <Steps.Step 
                key={item.title} 
                title={item.title}
                description={item.content}
                icon={item.icon}
              />
            ))}
          </Steps>
        </div>

          {/* Content Area */}
        <div style={{ padding: '24px', minHeight: 400 }}>
          {current === 0 && <StepDomainSelector onNext={handleDomainNext} />}
          {current === 1 && (
            <>
              <StepProjectTypeSelector onNext={handleProjectTypeNext} />
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 24 }}>
                <Button 
                  size="large"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setCurrent(current - 1)} 
                  disabled={current <= 0}
                  style={{ borderRadius: 8 }}
                >
                  Back
                </Button>
              </div>
            </>
          )}
          {current === 2 && (
            <>
              <StepAgreementSelector selectedSubdomainId={formData.subdomain?.id || ''} onNext={handleAgreementNext} />
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 24 }}>
                <Button 
                  size="large"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setCurrent(current - 1)} 
                  disabled={current <= 0}
                  style={{ borderRadius: 8 }}
                >
                  Back
                </Button>
              </div>
            </>
          )}
          {current === 3 && projectType === 'contractor' && (
            <>
              <StepContractorSelector agreementType={formData.agreementType || ''} onNext={handleContractorNext} />
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 24 }}>
                <Button 
                  size="large"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setCurrent(current - 1)} 
                  disabled={current <= 0}
                  style={{ borderRadius: 8 }}
                >
                  Back
                </Button>
              </div>
            </>
          )}
          {current === 3 && projectType === 'supplier' && (
            <>
              <StepEquipmentSelector
                selectedSubdomainId={formData.subdomain?.id || ''}
                agreementType={formData.agreementType || ''}
                onNext={handleEquipmentNext}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 24 }}>
                <Button 
                  size="large"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setCurrent(current - 1)} 
                  disabled={current <= 0}
                  style={{ borderRadius: 8 }}
                >
                  Back
                </Button>
              </div>
            </>
          )}
          {current === 4 && projectType === 'supplier' && (
            <div>
              <div style={{ 
                background: '#1890ff',
                padding: '20px',
                marginBottom: 24,
                color: 'white'
              }}>
                <Title level={4} style={{ color: 'white', margin: 0 }}>
                  Assign Suppliers to Equipment
                </Title>
                <div style={{ opacity: 0.9, marginTop: 4 }}>
                  Select reference and supplier for each piece of equipment
                </div>
              </div>
              
              {loadingManufacturers ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
                    Loading manufacturers...
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                    {formData.articles.map((article, index) => {
                      const currentSupplier = formData.suppliers.find(s => s.article_id === article.id);
                      const availableReferences = Array.from(new Set(manufacturerOptions[article.id]?.map(opt => opt.reference) || []));
                      
                      return (
                        <Card 
                          key={article.id} 
                          style={{ 
                            border: '1px solid #e8e8e8',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            transition: 'all 0.3s ease'
                          }}
                          hoverable
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 12,
                                marginBottom: 8 
                              }}>
                                <div style={{
                                  background: '#1890ff',
                                  color: 'white',
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 14,
                                  fontWeight: 'bold'
                                }}>
                                  {index + 1}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
                                    {article.name}
                                  </div>
                                  <div style={{ color: '#8c8c8c', fontSize: 14 }}>
                                    Category: {article.categories?.name || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <Select
                                style={{ width: 200 }}
                                placeholder="Select reference"
                                value={currentSupplier?.reference || undefined}
                                onChange={reference => {
                                  // Save the reference immediately so supplier dropdown becomes enabled
                                  setFormData(prev => ({
                                    ...prev,
                                    suppliers: [
                                      ...prev.suppliers.filter(s => s.article_id !== article.id),
                                      { article_id: article.id, manufacturer_id: '', reference }
                                    ]
                                  }));
                                }}
                                options={availableReferences.map(ref => ({ value: ref, label: ref }))}
                              />
                              <Select
                                style={{ width: 250 }}
                                placeholder="Select supplier"
                                value={currentSupplier?.manufacturer_id || undefined}
                                onChange={val => {
                                  if (currentSupplier?.reference) {
                                    handleSupplierChange(article.id, currentSupplier.reference, val);
                                  }
                                }}
                                options={currentSupplier?.reference ? 
                                  (manufacturerOptions[article.id] || [])
                                    .filter(opt => opt.reference === currentSupplier.reference)
                                    .map(opt => ({
                                      value: opt.value,
                                      label: `${opt.label}${opt.certified_by_onee ? ' (ONEE Certified)' : ''}`
                                    })) : []
                                }
                                disabled={!currentSupplier?.reference}
                                showSearch
                                filterOption={(input, option) =>
                                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                              />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                    <Button 
                      size="large"
                      icon={<ArrowLeftOutlined />}
                      onClick={() => setCurrent(current - 1)} 
                      disabled={current <= 0}
                      style={{ borderRadius: 8 }}
                    >
                      Back
                    </Button>
                    <Button 
                      type="primary" 
                      size="large"
                      icon={<ArrowRightOutlined />}
                      onClick={handleSuppliersNext} 
                      disabled={current === totalSteps - 1}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          {(current === 4 && projectType === 'contractor') || (current === 5 && projectType === 'supplier') ? (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <div style={{ 
                background: '#1890ff',
                padding: '20px',
                marginBottom: 24,
                color: 'white',
                textAlign: 'center'
              }}>
                <Title level={3} style={{ color: 'white', margin: 0 }}>
                  Project Summary
                </Title>
                <div style={{ opacity: 0.9, marginTop: 4 }}>
                  Review all information before finalizing your project
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                {/* Project Details */}
                <Card 
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      🏢 Project Information
                    </span>
                  }
                  style={{ 
                    borderRadius: 12,
                    border: '1px solid #f0f0f0'
                  }}
                >
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>Project Type:</span>
                      <span style={{ fontWeight: 500 }}>{projectType === 'contractor' ? 'Contractor Project' : 'Supplier/Equipment Project'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>Domain:</span>
                      <span style={{ fontWeight: 500 }}>{formData.subdomain?.domain?.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>Subdomain:</span>
                      <span style={{ fontWeight: 500 }}>{formData.subdomain?.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>Agreement Type:</span>
                      <span style={{ fontWeight: 500 }}>{formData.agreementType}</span>
                    </div>
                    {projectType === 'contractor' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>Contractor:</span>
                        <span style={{ fontWeight: 500 }}>{formData.contractor?.name}</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Equipment Summary - Only show for supplier projects */}
                {projectType === 'supplier' && (
                  <Card 
                    title={
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        📊 Equipment Summary
                      </span>
                    }
                    style={{ 
                      borderRadius: 12,
                      border: '1px solid #f0f0f0'
                    }}
                  >
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>Total Items:</span>
                        <span style={{ fontWeight: 500, color: '#1890ff' }}>{formData.articles.length}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>Suppliers Assigned:</span>
                        <span style={{ fontWeight: 500, color: '#52c41a' }}>{formData.suppliers.length}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>Assignment Rate:</span>
                        <span style={{ fontWeight: 500, color: '#faad14' }}>
                          {formData.articles.length > 0 ? Math.round((formData.suppliers.length / formData.articles.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Contractor Summary - Only show for contractor projects */}
                {projectType === 'contractor' && (
                  <Card 
                    title={
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        👥 Contractor Summary
                      </span>
                    }
                    style={{ 
                      borderRadius: 12,
                      border: '1px solid #f0f0f0'
                    }}
                  >
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>Contractor Name:</span>
                        <span style={{ fontWeight: 500, color: '#1890ff' }}>{formData.contractor?.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>Sigle:</span>
                        <span style={{ fontWeight: 500, color: '#52c41a' }}>{formData.contractor?.sigle || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>Country:</span>
                        <span style={{ fontWeight: 500, color: '#faad14' }}>{formData.contractor?.country || 'N/A'}</span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Equipment and Suppliers Details - Only show for supplier projects */}
              {projectType === 'supplier' && formData.articles.length > 0 && (
                <Card 
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      🏭 Equipment & Suppliers
                    </span>
                  }
                  style={{ 
                    borderRadius: 12,
                    border: '1px solid #f0f0f0',
                    marginBottom: 32
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {formData.articles.map((article: any) => {
                      const supplier = formData.suppliers.find(s => s.article_id === article.id);
                      const supplierName = supplier 
                        ? manufacturerOptions[article.id]?.find(opt => opt.value === supplier.manufacturer_id)?.label
                        : 'Not assigned';
                      
                      return (
                        <div key={article.id} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: 16,
                          background: supplier ? '#f6ffed' : '#fff2e8',
                          borderRadius: 8,
                          border: `1px solid ${supplier ? '#b7eb8f' : '#ffd591'}`
                        }}>
                          <div style={{ flex: 1 }}>
                            <Typography.Text strong style={{ fontSize: 16 }}>
                              {article.name}
                            </Typography.Text>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8,
                            minWidth: 200,
                            justifyContent: 'flex-end'
                          }}>
                            <Typography.Text style={{ color: '#6c757d' }}>Supplier:</Typography.Text>
                            <Typography.Text strong style={{ 
                              color: supplier ? '#52c41a' : '#fa8c16',
                              fontSize: 14
                            }}>
                              {supplierName}
                            </Typography.Text>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '24px 0',
                borderTop: '1px solid #e9ecef'
              }}>
                <Button 
                  size="large"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setCurrent(current - 1)} 
                  disabled={current <= 0}
                  style={{ borderRadius: 8 }}
                >
                  Back
                </Button>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={handleGeneratePDF}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: 8
                    }}
                  >
                    Generate PDF
                  </Button>
                  <Button 
                    type="default" 
                    size="large"
                    icon={<CheckOutlined />}
                    onClick={handleNext}
                    style={{
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      border: 'none',
                      color: 'white',
                      borderRadius: 8
                    }}
                  >
                    Finish Project
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default ProjectCreationWizard;
