export type Role = "owner" | "admin" | "member" | "guest";

export interface OrgWithRole {
  id: string;
  name: string;
  slug: string;
  plan: string;
  max_seats: number;
  is_active: boolean;
  created_at: string;
  role: Role;
}

export interface Member {
  user_id: string;
  email: string;
  full_name: string | null;
  role: Role;
  joined_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
}

export interface SignupOrgResponse {
  user_id: string;
  organization_id: string;
  email_confirmation_required: boolean;
  message: string;
}

export interface InvitePeek {
  email: string;
  role: Role;
  organization_name: string;
  existing_user: boolean;
}
