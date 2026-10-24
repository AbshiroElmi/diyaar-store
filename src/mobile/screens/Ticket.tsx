import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { Link as KLink, Toolbar } from "konsta/react";
import { useReplyTicket, useTickets } from "@/hooks/queries";
import { formatTime } from "@/lib/format";
import { haptic } from "@/lib/native";
import { cn } from "@/lib/utils";
import { Loading, Screen } from "../ui";

export default function TicketScreen() {
  const { id } = useParams();
  const { data } = useTickets();
  const reply = useReplyTicket();
  const ticket = data?.find((t) => t.name === id);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages.length]);

  const send = () => {
    if (!text.trim() || !ticket) return;
    haptic.tap();
    reply.mutate({ id: ticket.name, message: text }, { onSuccess: () => setText("") });
  };

  return (
    <Screen
      title={ticket?.subject ?? id}
      subtitle={ticket ? `${ticket.name}${ticket.order ? ` · ${ticket.order}` : ""}` : undefined}
      back
      right={
        ticket &&
        ticket.status !== "resolved" &&
        ticket.status !== "closed" && (
          <KLink navbar onClick={() => reply.mutate({ id: ticket.name, status: "resolved" })}>
            Resolve
          </KLink>
        )
      }
      footer={<div className="h-16" />}
    >
      {!ticket ? (
        <Loading />
      ) : (
        <div className="space-y-2 px-3 pt-4">
          {ticket.messages.map((m) => {
            const mine = m.from === "store";
            return (
              <div key={m.name} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                {!mine && <span className="mb-0.5 ml-3 text-[12px] text-black/45 dark:text-white/45">{m.author}</span>}
                <div className={cn("max-w-[78%] rounded-[20px] px-3.5 py-2 text-[16px] leading-snug", mine ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-white dark:bg-[#1c1c1d]")}>{m.body}</div>
                <span className="mx-3 mt-0.5 text-[11px] text-black/35 dark:text-white/35">{formatTime(m.creation)}</span>
              </div>
            );
          })}
          <div ref={end} />
        </div>
      )}

      <Toolbar className="fixed bottom-0 left-0 z-20 !h-auto" innerClassName="!h-auto gap-2 !px-3 !py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={ticket?.status === "closed" ? "This ticket is closed" : "Message"}
          disabled={ticket?.status === "closed"}
          className="h-9 flex-1 rounded-full border border-black/10 bg-white px-4 text-[16px] outline-none dark:border-white/15 dark:bg-black"
        />
        <button onClick={send} disabled={!text.trim() || reply.isPending} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40" aria-label="Send">
          <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </Toolbar>
    </Screen>
  );
}
