-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.agreement_category (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agreement_id uuid,
  category_id uuid,
  CONSTRAINT agreement_category_pkey PRIMARY KEY (id),
  CONSTRAINT agreement_category_agreement_id_fkey FOREIGN KEY (agreement_id) REFERENCES public.contractor_agreements(id),
  CONSTRAINT agreement_category_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.article_manufacturer (
  id uuid NOT NULL,
  article_id uuid,
  manufacturer_id uuid,
  reference text,
  certified_by_onee boolean,
  CONSTRAINT article_manufacturer_pkey PRIMARY KEY (id),
  CONSTRAINT article_manufacturer_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id),
  CONSTRAINT article_manufacturer_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id)
);
CREATE TABLE public.articles (
  id uuid NOT NULL,
  category_id uuid,
  name text NOT NULL,
  family_type text,
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL,
  name text NOT NULL,
  subdomain_id uuid,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_subdomain_id_fkey FOREIGN KEY (subdomain_id) REFERENCES public.subdomains(id)
);
CREATE TABLE public.category_agreement (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  agreement_type text,
  CONSTRAINT category_agreement_pkey PRIMARY KEY (id),
  CONSTRAINT category_agreement_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.contractor_agreements (
  id uuid NOT NULL,
  contractor_id uuid,
  type text,
  date_start date,
  date_end date,
  subdomain_id uuid,
  CONSTRAINT contractor_agreements_pkey PRIMARY KEY (id),
  CONSTRAINT contractor_agreements_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractors(id),
  CONSTRAINT contractor_agreements_subdomain_id_fkey FOREIGN KEY (subdomain_id) REFERENCES public.subdomains(id)
);
CREATE TABLE public.contractors (
  id uuid NOT NULL,
  name text,
  sigle text,
  address text,
  phone text,
  fax text,
  country text,
  CONSTRAINT contractors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.domains (
  id uuid NOT NULL,
  name text NOT NULL,
  CONSTRAINT domains_pkey PRIMARY KEY (id)
);
CREATE TABLE public.manufacturer_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  manufacturer_id uuid NOT NULL,
  contact_name text NOT NULL,
  phone text,
  email text,
  CONSTRAINT manufacturer_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT manufacturer_contacts0_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id)
);
CREATE TABLE public.manufacturers (
  id uuid NOT NULL,
  name text NOT NULL UNIQUE,
  contact text,
  phone text,
  email text,
  contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_supplier boolean DEFAULT true,
  CONSTRAINT manufacturers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.project_equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  article_id uuid NOT NULL,
  manufacturer_id uuid,
  reference text,
  certified_by_onee boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_equipment_pkey PRIMARY KEY (id),
  CONSTRAINT project_equipment_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id),
  CONSTRAINT project_equipment_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_equipment_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain_id uuid NOT NULL,
  subdomain_id uuid NOT NULL,
  agreement_type text NOT NULL,
  contractor_id uuid,
  project_type text DEFAULT 'supplier'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'active'::text,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractors(id),
  CONSTRAINT projects_subdomain_id_fkey FOREIGN KEY (subdomain_id) REFERENCES public.subdomains(id),
  CONSTRAINT projects_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.domains(id)
);

-- Create the completed_projects_view
CREATE OR REPLACE VIEW public.completed_projects_view AS
SELECT 
  p.id,
  p.name,
  p.created_at,
  p.updated_at,
  p.status,
  p.project_type,
  d.name as domain_name,
  sd.name as subdomain_name,
  p.agreement_type,
  c.name as contractor_name,
  c.sigle as contractor_sigle,
  c.address as contractor_address,
  c.phone as contractor_phone,
  c.fax as contractor_fax,
  c.country as contractor_country,
  COALESCE(pe_stats.total_equipment, 0) as total_equipment,
  COALESCE(pe_stats.assigned_suppliers, 0) as assigned_suppliers,
  COALESCE(pe_stats.unique_suppliers, 0) as unique_suppliers,
  COALESCE(pe_stats.categories_covered, 0) as categories_covered
FROM projects p
LEFT JOIN domains d ON p.domain_id = d.id
LEFT JOIN subdomains sd ON p.subdomain_id = sd.id
LEFT JOIN contractors c ON p.contractor_id = c.id
LEFT JOIN (
  SELECT 
    pe.project_id,
    COUNT(pe.id) as total_equipment,
    COUNT(pe.manufacturer_id) as assigned_suppliers,
    COUNT(DISTINCT pe.manufacturer_id) as unique_suppliers,
    COUNT(DISTINCT a.category_id) as categories_covered
  FROM project_equipment pe
  LEFT JOIN articles a ON pe.article_id = a.id
  GROUP BY pe.project_id
) pe_stats ON p.id = pe_stats.project_id
ORDER BY p.created_at DESC;

CREATE TABLE public.subdomains (
  id uuid NOT NULL,
  domain_id uuid,
  name text NOT NULL,
  CONSTRAINT subdomains_pkey PRIMARY KEY (id),
  CONSTRAINT subdomains_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.domains(id)
);