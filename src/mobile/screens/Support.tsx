import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, MessageCircle, Phone, Plus } from "lucide-react";
import { BlockTitle, Link as KLink, List, ListInput, ListItem } from "konsta/react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCreateTicket, useTickets } from "@/hooks/queries";
import type { SupportTicket } from "@/api";
import { timeAgo } from "@/lib/format";
import { ErrorBlock, FormSheet, IconTile, Loading, Screen } from "../ui";

const FAQ = [
  ["How do I get paid?", "Payouts go out every Monday to your EVC Plus or bank account. You can also withdraw early from Earnings."],
  ["Why is my product “In review”?", "New products are checked by Diyaar within a few hours to make sure photos and prices are correct."],
  ["A driver hasn't arrived", "Mark the order as ready. If no driver arrives within 10 minutes, open a ticket with the order number."],
];

export default function SupportScreen() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useTickets();
  const create = useCreateTicket();
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", category: "order" as SupportTicket["category"], priority: "normal" as SupportTicket["priority"], order: "", message: "" });

  return (
    <Screen
      title="Help & Support"
      back
      tabbar
      onRefresh={refetch}
      right={
        <KLink navbar iconOnly onClick={() => setCreating(true)}>
          <Plus className="h-7 w-7" />
        </KLink>
      }
    >
      <div className="grid grid-cols-3 gap-2 px-4 pt-4">
        {[
          { label: "Call", icon: Phone, color: "bg-[#34c759]", href: "tel:+252610000000" },
          { label: "WhatsApp", icon: MessageCircle, color: "bg-[#25d366]", href: "https://wa.me/252610000000" },
          { label: "New ticket", icon: Headphones, color: "bg-[#007aff]", onClick: () => setCreating(true) },
        ].map((a) => (
          <a key={a.label} href={a.href} onClick={a.onClick} target={a.href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex flex-col items-center gap-2 rounded-2xl border border-black/[0.06] bg-white py-4 text-[13px] font-medium dark:bg-[#1c1c1d]">
            <IconTile icon={a.icon} className={a.color} size="lg" />
            {a.label}
          </a>
        ))}
      </div>

      <BlockTitle>Your tickets</BlockTitle>
      {error ? (
        <ErrorBlock error={error} onRetry={refetch} />
      ) : isLoading ? (
        <Loading />
      ) : (
        <List strong inset dividers>
          {data?.map((t) => (
            <ListItem
              key={t.name}
              link
              onClick={() => navigate(`/support/${t.name}`)}
              title={t.subject}
              after={<StatusBadge status={t.status} dot={false} className="px-1.5 text-[11px]" />}
              text={`${t.name} · ${timeAgo(t.modified)}`}
            />
          ))}
          {!data?.length && <ListItem title="No tickets yet" />}
        </List>
      )}

      <BlockTitle>Common questions</BlockTitle>
      <List strong inset dividers>
        {FAQ.map(([q, a]) => (
          <ListItem key={q} link chevron={false} onClick={() => setOpen(open === q ? null : q)} title={q} text={open === q ? a : undefined} after={open === q ? "−" : "+"} />
        ))}
      </List>

      <FormSheet
        opened={creating}
        onClose={() => setCreating(false)}
        title="New ticket"
        saveLabel="Send"
        saving={create.isPending}
        canSave={!!form.subject.trim() && !!form.message.trim()}
        onSave={() =>
          create.mutate(form, {
            onSuccess: (t) => {
              setCreating(false);
              setForm({ subject: "", category: "order", priority: "normal", order: "", message: "" });
              navigate(`/support/${t.name}`);
            },
          })
        }
      >
        <List strongIos insetIos>
          <ListInput label="Topic" type="select" dropdown value={form.category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, category: e.target.value as SupportTicket["category"] })}>
            <option value="order">An order</option>
            <option value="payment">Payments & payouts</option>
            <option value="account">My account or store</option>
            <option value="technical">App problem</option>
            <option value="other">Something else</option>
          </ListInput>
          <ListInput label="Urgency" type="select" dropdown value={form.priority} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, priority: e.target.value as SupportTicket["priority"] })}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High — affecting orders now</option>
          </ListInput>
          {form.category === "order" && <ListInput label="Order number" placeholder="DY-000000" value={form.order} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, order: e.target.value.toUpperCase() })} />}
          <ListInput label="Subject" value={form.subject} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, subject: e.target.value })} />
          <ListInput label="Message" type="textarea" inputClassName="!h-28 resize-none" placeholder="Tell us what happened…" value={form.message} onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, message: e.target.value })} />
        </List>
      </FormSheet>
    </Screen>
  );
}
