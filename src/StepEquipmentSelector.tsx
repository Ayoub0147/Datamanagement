import React, { useEffect, useState } from 'react';
import { Checkbox, Button, Spin, Typography, message, Collapse } from 'antd';
import { supabase } from './supabaseClient';

const { Title } = Typography;
const { Panel } = Collapse;

interface StepEquipmentSelectorProps {
  selectedSubdomainId: string;
  agreementType: string;
  onNext: (selectedArticles: any[]) => void;
}

interface Article {
  id: string;
  name: string;
  categories: {
    name: string;
    subdomain_id: string;
  } | null;
}

interface GroupedArticles {
  [categoryName: string]: Article[];
}

const StepEquipmentSelector: React.FC<StepEquipmentSelectorProps> = ({ selectedSubdomainId, agreementType, onNext }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [groupedArticles, setGroupedArticles] = useState<GroupedArticles>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      console.log('Fetching articles for subdomain:', selectedSubdomainId, 'agreement:', agreementType);
      
      // First, let's see what categories exist for this subdomain
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          subdomain_id
        `)
        .eq('subdomain_id', selectedSubdomainId);

      console.log('Categories found:', categoryData);
      console.log('Category error:', categoryError);

      if (categoryError) {
        console.error('Supabase error:', categoryError);
        message.error('Failed to fetch categories');
        setLoading(false);
        return;
      }

      if (!categoryData || categoryData.length === 0) {
        console.log('No categories found for subdomain');
        setArticles([]);
        setGroupedArticles({});
        setLoading(false);
        return;
      }

      // Get category IDs
      const categoryIds = categoryData.map(cat => cat.id);
      console.log('Category IDs:', categoryIds);

      // Get articles for these categories
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          name,
          category:categories!inner (
            name,
            subdomain_id
          )
        `)
        .in('category_id', categoryIds);
      
      console.log('Articles found:', data);
      console.log('Article error:', error);
      
      if (error) {
        console.error('Supabase error:', error);
        message.error('Failed to fetch articles');
        setLoading(false);
        return;
      }

      // Transform data to match our interface
      const filteredArticles = (data || []).map((article: any) => ({
        id: article.id,
        name: article.name,
        categories: article.category
      }));

      console.log('Transformed articles:', filteredArticles);

      setArticles(filteredArticles);

      // Group articles by category
      const grouped: GroupedArticles = {};
      filteredArticles.forEach((article: Article) => {
        const categoryName = article.categories?.name || 'Uncategorized';
        if (!grouped[categoryName]) {
          grouped[categoryName] = [];
        }
        grouped[categoryName].push(article);
      });

      console.log('Grouped articles:', grouped);
      setGroupedArticles(grouped);
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
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={4}>Select Equipment</Title>
      {loading ? (
        <Spin />
      ) : articles.length === 0 ? (
        <Typography.Text>No equipment found for this subdomain and agreement type.</Typography.Text>
      ) : (
        <div>
          <Collapse expandIconPosition="end">
            {Object.entries(groupedArticles).map(([categoryName, categoryArticles]) => (
              <Panel 
                header={`${categoryName} (${categoryArticles.length} items)`} 
                key={categoryName}
                style={{ marginBottom: 8 }}
              >
                <Checkbox.Group
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                  value={selected}
                  onChange={vals => setSelected(vals as string[])}
                >
                  {categoryArticles.map(article => (
                    <Checkbox key={article.id} value={article.id} style={{ marginBottom: 4 }}>
                      {article.name}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </Panel>
            ))}
          </Collapse>
        </div>
      )}
      <Button type="primary" onClick={handleNext} disabled={selected.length === 0} style={{ marginTop: 16 }}>
        Next
      </Button>
    </div>
  );
};

export default StepEquipmentSelector;
