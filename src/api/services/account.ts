import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { TeamMember, TeamMemberInput } from "../types";

interface MemberRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: string;
  is_active: number;
  last_login: string | null;
  can_disable: boolean;
}

export const teamService = {
  list: () =>
    api.get<{ data: MemberRow[] }>(ENDPOINTS.getTeam, { include_inactive: 1, page_size: 100 }).then((r) =>
      r.data.map<TeamMember>((m) => ({
        name: m.id,
        full_name: m.name,
        email: m.email,
        phone: m.phone,
        role: m.user_type === "store_staff" ? "Staff" : "Owner",
        status: m.is_active ? "active" : "disabled",
        last_active: m.last_login ?? undefined,
        can_manage: !!m.can_disable,
      })),
    ),
  /** Store owners can add staff; each gets their own email and password. */
  create: (data: TeamMemberInput) => api.post(ENDPOINTS.createMember, { ...data, user_type: "store_staff", role: "Store Staff" }),
  setActive: (memberId: string, active: boolean) => api.post(ENDPOINTS.updateMember, { user_id: memberId, is_active: active ? 1 : 0 }),
};
