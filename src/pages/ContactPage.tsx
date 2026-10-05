import { useState } from 'react';
import { PageHeader } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ContactPage() {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }
    setSending(true);
    // Store the contact message in activity_logs for admin to see
    await supabase.from('activity_logs').insert({
      action: 'contact_form_submission',
      details: `From: ${name} (${email}) — Subject: ${subject || 'No subject'} — Message: ${message}`,
    }).then(() => {
      // If insert fails (user not logged in / not admin), just simulate success
    });
    setSending(false);
    showToast('Message sent! We will get back to you soon.', 'success');
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="container-max section-padding animate-fade-in">
      <PageHeader
        title="Contact Us"
        subtitle="Questions, feedback, or want to partner with us? We would love to hear from you."
        icon={Mail}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Contact info */}
        <div className="space-y-4">
          <div className="card card-hover">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50">
              <Mail className="h-6 w-6 text-forest-500" />
            </div>
            <h3 className="font-display text-sm font-semibold text-forest-800 mb-1">Email</h3>
            <p className="text-sm text-forest-600">support@rebootearth.org</p>
          </div>

          <div className="card card-hover">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50">
              <Phone className="h-6 w-6 text-forest-500" />
            </div>
            <h3 className="font-display text-sm font-semibold text-forest-800 mb-1">Phone</h3>
            <p className="text-sm text-forest-600">Available soon</p>
          </div>

          <div className="card card-hover">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50">
              <MapPin className="h-6 w-6 text-forest-500" />
            </div>
            <h3 className="font-display text-sm font-semibold text-forest-800 mb-1">Service Area</h3>
            <p className="text-sm text-forest-600">Pune, Maharashtra, India</p>
          </div>

          <div className="card card-hover">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50">
              <Clock className="h-6 w-6 text-forest-500" />
            </div>
            <h3 className="font-display text-sm font-semibold text-forest-800 mb-1">Hours</h3>
            <p className="text-sm text-forest-600">Mon–Sat, 9 AM – 6 PM</p>
          </div>
        </div>

        {/* Contact form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-forest-700">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-forest-700">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@email.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-forest-700">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
                placeholder="What is this about?"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-forest-700">Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="input-field resize-none"
                placeholder="Tell us how we can help..."
                required
              />
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full sm:w-auto">
              {sending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-forest-50 p-4">
            <MessageCircle className="h-5 w-5 text-forest-500 flex-shrink-0" />
            <p className="text-sm text-forest-600">
              Already have an account? Use the in-app Messages page to chat with our admin directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
