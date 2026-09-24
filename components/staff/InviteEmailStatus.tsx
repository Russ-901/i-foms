import { Mail, AlertTriangle } from 'lucide-react';

export default function InviteEmailStatus({ emailSent }: { emailSent: boolean }) {
  return (
    <div
      className={`flex items-start gap-2.5 p-3 rounded-md border text-sm ${
        emailSent
          ? 'bg-green-500/10 border-green-500/30 text-green-300'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
      }`}
    >
      {emailSent ? (
        <Mail size={16} className="mt-0.5 shrink-0" />
      ) : (
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      )}
      <div>
        <p className="font-medium">
          {emailSent ? 'Invite email sent' : 'Invite email failed to send'}
        </p>
        <p className="text-xs opacity-90 mt-0.5">
          {emailSent
            ? 'They should receive it shortly. You can also share the link below directly.'
            : 'Check the EMAIL_* settings in .env.local — the link below still works, so copy and share it directly.'}
        </p>
      </div>
    </div>
  );
}
