import { useState } from "react";
import { Plus, ShieldCheck, Users } from "lucide-react";
import { Actions, ActionsButton, ActionsGroup, ActionsLabel, BlockFooter, Link as KLink, List, ListInput, ListItem, Segmented, SegmentedButton } from "konsta/react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useInviteMember, useRemoveMember, useTeam, useUpdateMember } from "@/hooks/queries";
import type { TeamMember, TeamRole } from "@/api";
import { initials, timeAgo } from "@/lib/format";
import { Empty, ErrorBlock, FormSheet, Loading, Screen } from "../ui";

const ROLE_HELP: Record<TeamRole, string> = {
  Owner: "Everything, including payouts and team",
  Manager: "Orders, menu, promotions, reports and store details",
  Staff: "Accept and prepare orders, mark items sold out",
};

export default function TeamScreen() {
  const { data, isLoading, error, refetch } = useTeam();
  const invite = useInviteMember();
  const update = useUpdateMember();
  const remove = useRemoveMember();
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", role: "Staff" as TeamRole });
  const [selected, setSelected] = useState<TeamMember | null>(null);

  return (
    <Screen
      title="Team"
      back
      tabbar
      onRefresh={refetch}
      right={
        <KLink navbar iconOnly onClick={() => setInviting(true)}>
          <Plus className="h-7 w-7" />
        </KLink>
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
                link={m.role !== "Owner"}
                chevron={m.role !== "Owner"}
                onClick={() => m.role !== "Owner" && setSelected(m)}
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
        opened={inviting}
        onClose={() => setInviting(false)}
        title="Invite"
        saveLabel="Send"
        saving={invite.isPending}
        canSave={!!form.full_name.trim() && form.email.includes("@")}
        onSave={() =>
          invite.mutate(form, {
            onSuccess: () => {
              setInviting(false);
              setForm({ full_name: "", email: "", phone: "", role: "Staff" });
            },
          })
        }
      >
        <List strongIos insetIos>
          <ListInput label="Full name" value={form.full_name} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, full_name: e.target.value })} />
          <ListInput label="Email" type="email" value={form.email} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} />
          <ListInput label="Phone" type="tel" placeholder="+252…" value={form.phone} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })} />
        </List>
        <div className="px-4">
          <Segmented strong rounded>
            {(["Manager", "Staff"] as const).map((r) => (
              <SegmentedButton key={r} strong rounded active={form.role === r} onClick={() => setForm({ ...form, role: r })}>
                {r}
              </SegmentedButton>
            ))}
          </Segmented>
        </div>
        <BlockFooter>{ROLE_HELP[form.role]}</BlockFooter>
      </FormSheet>

      <Actions opened={!!selected} onBackdropClick={() => setSelected(null)}>
        <ActionsGroup>
          <ActionsLabel>
            {selected?.full_name} · {selected?.role}
          </ActionsLabel>
          {selected?.role === "Staff" && <ActionsButton onClick={() => (update.mutate({ id: selected.name, data: { role: "Manager" } }), setSelected(null))}>Make manager</ActionsButton>}
          {selected?.role === "Manager" && <ActionsButton onClick={() => (update.mutate({ id: selected.name, data: { role: "Staff" } }), setSelected(null))}>Change to staff</ActionsButton>}
          {selected && (
            <ActionsButton onClick={() => (update.mutate({ id: selected.name, data: { status: selected.status === "disabled" ? "active" : "disabled" } }), setSelected(null))}>
              {selected.status === "disabled" ? "Enable access" : "Disable access"}
            </ActionsButton>
          )}
          <ActionsButton className="!text-[#ff3b30]" onClick={() => (selected && remove.mutate(selected.name), setSelected(null))}>
            Remove from team
          </ActionsButton>
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton bold onClick={() => setSelected(null)}>
            Cancel
          </ActionsButton>
        </ActionsGroup>
      </Actions>
    </Screen>
  );
}
