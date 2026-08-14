export interface Service {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
}
