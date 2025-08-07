-- Link article categories with contractor agreements
-- This will allow you to associate specific categories with contractor agreements

-- First, let's modify the category_agreement table to include contractor_agreement_id
ALTER TABLE public.category_agreement 
ADD COLUMN contractor_agreement_id uuid,
ADD CONSTRAINT category_agreement_contractor_agreement_id_fkey 
FOREIGN KEY (contractor_agreement_id) REFERENCES public.contractor_agreements(id);

-- Add an index for better performance
CREATE INDEX idx_category_agreement_contractor_agreement 
ON public.category_agreement(contractor_agreement_id);

-- Create a view to easily see which categories are linked to which contractor agreements
CREATE OR REPLACE VIEW public.category_contractor_agreements AS
SELECT 
    ca.id as category_agreement_id,
    ca.agreement_type,
    ca.category_id,
    c.name as category_name,
    ca.contractor_agreement_id,
    cag.id as contractor_agreement_id,
    cag.type as contractor_agreement_type,
    cag.date_start,
    cag.date_end,
    cag.subdomain_id,
    s.name as subdomain_name,
    d.name as domain_name,
    cont.name as contractor_name,
    cont.sigle as contractor_sigle
FROM public.category_agreement ca
LEFT JOIN public.categories c ON ca.category_id = c.id
LEFT JOIN public.contractor_agreements cag ON ca.contractor_agreement_id = cag.id
LEFT JOIN public.subdomains s ON cag.subdomain_id = s.id
LEFT JOIN public.domains d ON s.domain_id = d.id
LEFT JOIN public.contractors cont ON cag.contractor_id = cont.id;

-- Create a view to see all categories and their associated agreements (if any)
CREATE OR REPLACE VIEW public.categories_with_agreements AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    s.name as subdomain_name,
    d.name as domain_name,
    COALESCE(ca.agreement_type, 'No agreement') as agreement_type,
    COALESCE(cag.type, 'No contractor agreement') as contractor_agreement_type,
    COALESCE(cont.name, 'No contractor') as contractor_name,
    cag.date_start,
    cag.date_end
FROM public.categories c
LEFT JOIN public.subdomains s ON c.subdomain_id = s.id
LEFT JOIN public.domains d ON s.domain_id = d.id
LEFT JOIN public.category_agreement ca ON c.id = ca.category_id
LEFT JOIN public.contractor_agreements cag ON ca.contractor_agreement_id = cag.id
LEFT JOIN public.contractors cont ON cag.contractor_id = cont.id;

-- Example queries you can use:

-- 1. Get all categories linked to a specific contractor agreement
-- SELECT * FROM public.category_contractor_agreements WHERE contractor_agreement_id = 'your-contractor-agreement-id';

-- 2. Get all contractor agreements for a specific category
-- SELECT * FROM public.category_contractor_agreements WHERE category_id = 'your-category-id';

-- 3. Get all categories with their agreement status
-- SELECT * FROM public.categories_with_agreements;

-- 4. Get categories that don't have any agreements
-- SELECT * FROM public.categories_with_agreements WHERE agreement_type = 'No agreement'; 