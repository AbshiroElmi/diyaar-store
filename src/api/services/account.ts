import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { AppNotification, StoreSettings, SupportTicket, TeamMember, TicketStatus } from "../types";

export const teamService = {
  list: () => api.get<{ success: boolean; members: TeamMember[] }>(ENDPOINTS.getTeam).then((r) => r.members),
  invite: (data: Pick<TeamMember, "full_name" | "email" | "phone" | "role">) =>
    api.post<{ success: boolean; member: TeamMember }>(ENDPOINTS.inviteMember, data).then((r) => r.member),
  update: (memberId: string, data: Partial<TeamMember>) =>
    api.post<{ success: boolean; member: TeamMember }>(ENDPOINTS.updateMember, { member_id: memberId, ...data }).then((r) => r.member),
  remove: (memberId: string) => api.post<{ success: boolean }>(ENDPOINTS.removeMember, { member_id: memberId }),
};

export const notificationsService = {
  list: () => api.get<{ success: boolean; notifications: AppNotification[]; unread: number }>(ENDPOINTS.getNotifications),
  markRead: (ids?: string[]) => api.post<{ success: boolean }>(ENDPOINTS.markNotificationsRead, { ids }),
};

export const supportService = {
  list: () => api.get<{ success: boolean; tickets: SupportTicket[] }>(ENDPOINTS.getTickets).then((r) => r.tickets),
  create: (data: Pick<SupportTicket, "subject" | "category" | "priority" | "order"> & { message: string }) =>
    api.post<{ success: boolean; ticket: SupportTicket }>(ENDPOINTS.createTicket, data).then((r) => r.ticket),
  reply: (ticketId: string, data: { message?: string; status?: TicketStatus }) =>
    api.post<{ success: boolean; ticket: SupportTicket }>(ENDPOINTS.replyTicket, { ticket_id: ticketId, ...data }).then((r) => r.ticket),
};

export const settingsService = {
  get: () => api.get<{ success: boolean; settings: StoreSettings }>(ENDPOINTS.getSettings).then((r) => r.settings),
  update: (settings: StoreSettings) =>
    api.post<{ success: boolean; settings: StoreSettings }>(ENDPOINTS.updateSettings, { settings }).then((r) => r.settings),
};
