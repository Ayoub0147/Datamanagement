import React, { useEffect, useState } from 'react';
import { Checkbox, Button, Spin, Typography, message } from 'antd';
import { supabase } from './supabaseClient';

const { Title } = Typography;

interface StepCategorySelectorProps {
  selectedSubdomainId: string;
  agreementType: string;
  onNext: (selectedArticles: any[]) => void;
}

const StepCategorySelector: React.FC<StepCategorySelectorProps> = ({ selectedSubdomainId, agreementType, onNext }) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          name,
          categories (
            subdomain_id
          )
        `)
        .ilike('agreement_viable::text', `%${agreementType}%`);
      if (error) {
        console.error('Supabase error:', error);
        message.error('Failed to fetch articles');
        setLoading(false);
        return;
      }
      const filtered = (data || []).filter(
        (a: any) => a.categories?.subdomain_id === selectedSubdomainId
      );
      setArticles(filtered);
      setLoading(false);
    };
    if (selectedSubdomainId && agreementType) {
      fetchArticles();
    }
  }, [selectedSubdomainId, agreementType]);

  const handleNext = () => {
    const selectedArticles = articles.filter(a => selected.includes(a.id));
    if (selectedArticles.length === 0) {
      message.warning('Please select at least one article.');
      return;
    }
    onNext(selectedArticles);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={4}>Select Category</Title>
      {loading ? (
        <Spin />
      ) : articles.length === 0 ? (
        <Typography.Text>No categories found for this subdomain and agreement type.</Typography.Text>
      ) : (
        <Checkbox.Group
          style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}
          value={selected}
          onChange={vals => setSelected(vals as string[])}
        >
          {articles.map(article => (
            <Checkbox key={article.id} value={article.id}>
              {article.name}
            </Checkbox>
          ))}
        </Checkbox.Group>
      )}
      <Button type="primary" onClick={handleNext} disabled={selected.length === 0} style={{ marginTop: 16 }}>
        Next
      </Button>
    </div>
  );
};

export default StepCategorySelector;
