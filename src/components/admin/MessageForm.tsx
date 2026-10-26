export function MessageForm({ action, defaultSubject }: { action: (fd: FormData) => Promise<void>; defaultSubject?: string }) {
  return (
    <form action={action} className="space-y-2">
      <input name="subject" className="input" placeholder="Subject" defaultValue={defaultSubject} required />
      <textarea name="body" className="input" rows={4} placeholder="Message to the customer" required />
      <button className="btn-outline btn-sm">Send message</button>
      <p className="hint">Sent in the company&apos;s name with its signature, and logged in Communications.</p>
    </form>
  );
}
