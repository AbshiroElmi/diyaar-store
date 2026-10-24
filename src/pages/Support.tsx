import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Headphones, Loader2, MessageCircle, Phone, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResponsiveDialog } from "@/components/shared/ResponsiveDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";
import { useCreateTicket, useReplyTicket, useTickets } from "@/hooks/queries";
import type { SupportTicket } from "@/api";
import { formatDateTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const CATEGORIES: Array<{ value: SupportTicket["category"]; label: string }> = [
  { value: "order", label: "An order" },
  { value: "payment", label: "Payments & payouts" },
  { value: "account", label: "My account or store" },
  { value: "technical", label: "App problem" },
  { value: "other", label: "Something else" },
];

const FAQ = [
  ["How do I get paid?", "Payouts go out every Monday to your EVC Plus or bank account. You can also withdraw early from Earnings."],
  ["Why is my product “In review”?", "New products are checked by Diyaar within a few hours to make sure photos and prices are correct."],
  ["A driver hasn't arrived — what do I do?", "Mark the order as ready. If no driver arrives within 10 minutes, open a ticket with the order number."],
];

function NewTicketDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const create = useCreateTicket();
  const [form, setForm] = useState({ subject: "", category: "order" as SupportTicket["category"], priority: "normal" as SupportTicket["priority"], order: "", message: "" });

  useEffect(() => {
    if (open) setForm({ subject: "", category: "order", priority: "normal", order: "", message: "" });
  }, [open]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Contact Diyaar support"
      description="We usually reply within 1 hour, 7am–11pm."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!form.subject.trim() || !form.message.trim() || create.isPending} onClick={() => create.mutate(form, { onSuccess: () => onOpenChange(false) })}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Topic</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as SupportTicket["category"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Urgency</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as SupportTicket["priority"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low — when you can</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High — affecting orders now</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {form.category === "order" && (
          <div className="space-y-1.5">
            <Label htmlFor="sp-order">Order number</Label>
            <Input id="sp-order" placeholder="DY-000000" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value.toUpperCase() })} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="sp-subject">Subject</Label>
          <Input id="sp-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Short summary" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-msg">Message</Label>
          <Textarea id="sp-msg" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what happened…" />
        </div>
      </div>
    </ResponsiveDialog>
  );
}

function TicketThread({ ticket, onBack }: { ticket: SupportTicket; onBack: () => void }) {
  const reply = useReplyTicket();
  const [text, setText] = useState("");
  const closed = ticket.status === "closed";

  return (
    <Card className="flex min-h-[28rem] flex-col">
      <div className="flex items-start gap-3 border-b p-4">
        <Button variant="ghost" size="icon" className="-ml-1 h-8 w-8 shrink-0 lg:hidden" onClick={onBack} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{ticket.subject}</p>
          <p className="text-xs text-muted-foreground">
            {ticket.name}
            {ticket.order ? ` · ${ticket.order}` : ""} · opened {formatDateTime(ticket.creation)}
          </p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {ticket.messages.map((m) => (
          <div key={m.name} className={cn("flex", m.from === "store" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", m.from === "store" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted")}>
              <p className={cn("mb-0.5 text-xs", m.from === "store" ? "opacity-80" : "text-muted-foreground")}>
                {m.author} · {timeAgo(m.creation)}
              </p>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t p-3">
        <div className="flex gap-2">
          <Textarea
            rows={1}
            className="min-h-10 resize-none"
            placeholder={closed ? "This ticket is closed" : "Write a reply…"}
            disabled={closed}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button size="icon" className="h-10 w-10 shrink-0" disabled={!text.trim() || reply.isPending || closed} onClick={() => reply.mutate({ id: ticket.name, message: text }, { onSuccess: () => setText("") })} aria-label="Send">
            {reply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        {ticket.status !== "resolved" && !closed && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => reply.mutate({ id: ticket.name, status: "resolved" })}>
            Mark as resolved
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function Support() {
  const { data, isLoading, error, refetch } = useTickets();
  const [selected, setSelected] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const ticket = data?.find((t) => t.name === selected);

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Questions about orders, payouts or your account? We're here to help."
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New ticket
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <a href="tel:+252610000000" className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center text-sm font-medium transition-colors hover:bg-muted">
          <Phone className="h-5 w-5 text-primary" /> Call us
        </a>
        <a href="https://wa.me/252610000000" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center text-sm font-medium transition-colors hover:bg-muted">
          <MessageCircle className="h-5 w-5 text-success" /> WhatsApp
        </a>
        <button onClick={() => setNewOpen(true)} className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center text-sm font-medium transition-colors hover:bg-muted">
          <Headphones className="h-5 w-5 text-info" /> Ticket
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem,1fr]">
        <div className={cn("space-y-3", ticket && "hidden lg:block")}>
          <h2 className="text-sm font-semibold text-muted-foreground">Your tickets</h2>
          <Card className="divide-y overflow-hidden">
            {isLoading ? (
              <ListSkeleton rows={3} />
            ) : !data?.length ? (
              <EmptyState icon={Headphones} title="No tickets yet" />
            ) : (
              data.map((t) => (
                <button key={t.name} onClick={() => setSelected(t.name)} className={cn("block w-full p-4 text-left transition-colors hover:bg-muted/50", selected === t.name && "bg-accent/50")}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-medium">{t.subject}</p>
                    <StatusBadge status={t.status} dot={false} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{t.messages[t.messages.length - 1]?.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.name} · {timeAgo(t.modified)}
                  </p>
                </button>
              ))
            )}
          </Card>
        </div>

        <div className={cn(!ticket && "hidden lg:block")}>
          {ticket ? (
            <TicketThread ticket={ticket} onBack={() => setSelected(null)} />
          ) : (
            <Card>
              <CardContent className="space-y-4 p-6">
                <p className="flex items-center gap-2 font-semibold">
                  <BookOpen className="h-4 w-4 text-primary" /> Common questions
                </p>
                {FAQ.map(([q, a]) => (
                  <details key={q} className="group rounded-lg border p-3">
                    <summary className="cursor-pointer list-none text-sm font-medium">{q}</summary>
                    <p className="mt-2 text-sm text-muted-foreground">{a}</p>
                  </details>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <NewTicketDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
