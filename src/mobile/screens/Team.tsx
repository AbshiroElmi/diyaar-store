import { useState } from "react";
import { Plus, ShieldCheck, UserCheck, Users, UserX } from "lucide-react";
import { ActionsGroup, ActionsLabel, BlockFooter, Link as KLink, List, ListInput, ListItem } from "konsta/react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useAddMember, useSetMemberActive, useTeam } from "@/hooks/queries";
import type { TeamMember, TeamMemberInput } from "@/api";
import { initials, timeAgo } from "@/lib/format";
import { ActionItem, Actions, Empty, ErrorBlock, FormSheet, Loading, Screen } from "../ui";

const MIN_PASSWORD = 8;
const EMPTY: TeamMemberInput = { full_name: "", email: "", phone: "", password: "" };

export default function TeamScreen() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useTeam();
  const add = useAddMember();
  const setActive = useSetMemberActive();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const canAdd = !!user?.is_store_admin;
  const field = (k: keyof TeamMemberInput) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <Screen
      title="Team"
      back
      tabbar
      onRefresh={refetch}
      right={
        canAdd && (
          <KLink navbar iconOnly onClick={() => setAdding(true)}>
            <Plus className="h-7 w-7" />
          </KLink>
        )
      }
    >
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty icon={Users} title="Just you" />
      ) : (
        <>
          <List strong inset dividers className="!mt-4">
            {data.map((m) => (
              <ListItem
                key={m.name}
                link={m.can_manage}
                chevron={m.can_manage}
                onClick={() => m.can_manage && setSelected(m)}
                media={<span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#5ac8fa] to-[#007aff] text-[15px] font-semibold text-white">{initials(m.full_name)}</span>}
                title={
                  <span className="flex items-center gap-1.5">
                    {m.full_name}
                    {m.role === "Owner" && <ShieldCheck className="h-4 w-4 text-primary" />}
                  </span>
                }
                text={m.status === "active" ? (m.last_active ? `${m.role} · active ${timeAgo(m.last_active)}` : m.role) : undefined}
                after={m.status !== "active" ? <StatusBadge status={m.status} /> : undefined}
                footer={m.status !== "active" ? m.role : undefined}
              />
            ))}
          </List>
          <BlockFooter>Each person gets their own login, so you can see who accepted or changed what.</BlockFooter>
        </>
      )}

      <FormSheet
        opened={adding}
        onClose={() => setAdding(false)}
        title="Add staff"
        saveLabel="Add"
        saving={add.isPending}
        canSave={!!form.full_name.trim() && form.email.includes("@") && form.password.length >= MIN_PASSWORD}
        onSave={() =>
          add.mutate(form, {
            onSuccess: () => {
              setAdding(false);
              setForm(EMPTY);
            },
          })
        }
      >
        <List strongIos insetIos>
          <ListInput label="Full name" value={form.full_name} onInput={field("full_name")} />
          <ListInput label="Email" type="email" value={form.email} onInput={field("email")} />
          <ListInput label="Phone" type="tel" placeholder="+252…" value={form.phone} onInput={field("phone")} />
          <ListInput label="Password" type="password" placeholder={`At least ${MIN_PASSWORD} characters`} value={form.password} onInput={field("password")} />
        </List>
        <BlockFooter>Staff sign in with this email and password, or with a code sent to their phone. They can accept and prepare orders and update the menu.</BlockFooter>
      </FormSheet>

      <Actions opened={!!selected} onBackdropClick={() => setSelected(null)}>
        <ActionsGroup>
          <ActionsLabel>
            {selected?.full_name} · {selected?.role}
          </ActionsLabel>
          {selected && (
            <ActionItem
              icon={selected.status === "disabled" ? UserCheck : UserX}
              danger={selected.status === "active"}
              onClick={() => (setActive.mutate({ id: selected.name, active: selected.status === "disabled" }), setSelected(null))}
            >
              {selected.status === "disabled" ? "Turn access back on" : "Turn off access"}
            </ActionItem>
          )}
        </ActionsGroup>
      </Actions>
    </Screen>
  );
}
