import React, { useState } from 'react';
import { MessageCircle, Send, X, Star, CheckCircle, Mail, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { addFeedbackDoc } from '../lib/apiService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  userName?: string;
}

export default function FeedbackModal({ isOpen, onClose, userRole = 'Contact Agent', userName }: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<string>('General Experience');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const targetEmail = 'zekariaszenebe21@gmail.com';
  const emailSubject = 'Website Feedback';

  const categories = [
    'General Experience',
    'Feature Suggestion',
    'Bug / Issue Report',
    'Data Accuracy',
    'User Interface / Usability',
    'Other'
  ];

  const buildBodyContent = () => {
    const starDisplay = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    return [
      `Website Experience Feedback`,
      `=============================`,
      `Rating: ${rating}/5 (${starDisplay})`,
      `Category: ${category}`,
      `Submitted By: ${userName || userRole || 'Contact Center User'}`,
      `Date & Time: ${new Date().toLocaleString('en-US')}`,
      ``,
      `User Feedback & Comments:`,
      `-----------------------------`,
      feedbackText.trim() ? feedbackText.trim() : '(No additional text provided)',
      ``,
      `-----------------------------`,
      `Sent from Ethiopian Electric Utility (EEU) Feeder Interruption Contact Center Portal`
    ].join('\n');
  };

  const handleSendEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const bodyContent = buildBodyContent();

    // 1. Store in Database database
    try {
      await addFeedbackDoc({
        rating,
        category,
        feedbackText: feedbackText.trim(),
        submittedBy: userName || userRole || 'Contact Center User',
        targetEmail
      });
    } catch (err) {
      console.warn('Feedback doc save warning:', err);
    }

    // 2. Open Gmail Web directly in a new window/tab for automatic draft/send
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(bodyContent)}`;
    const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(bodyContent)}`;

    // Try opening Gmail Web in a popup/tab, fallback to mailto
    const openedWindow = window.open(gmailUrl, '_blank');
    if (!openedWindow) {
      window.location.href = mailtoUrl;
    }

    setIsSubmitting(false);
    setSubmitted(true);
  };

  const handleOpenGmailWeb = () => {
    const bodyContent = buildBodyContent();
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(bodyContent)}`;
    window.open(gmailUrl, '_blank');
  };

  const handleOpenDefaultMailApp = () => {
    const bodyContent = buildBodyContent();
    const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(bodyContent)}`;
    window.location.href = mailtoUrl;
  };

  const handleCopyText = () => {
    const bodyContent = buildBodyContent();
    navigator.clipboard.writeText(bodyContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setFeedbackText('');
    setRating(5);
    setCategory('General Experience');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-eeu-green/10 via-transparent to-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-eeu-green/15 text-eeu-green flex items-center justify-center font-bold">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-gray-900 dark:text-white">
                Share Website Feedback
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sends directly to <span className="font-semibold text-eeu-green">{targetEmail}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">Feedback Sent & Saved!</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                Your feedback has been saved and routed to Gmail for <strong className="text-eeu-green">{targetEmail}</strong>.
              </p>
            </div>

            {/* Direct Action triggers */}
            <div className="pt-3 flex flex-col gap-2.5 max-w-sm mx-auto">
              <button
                type="button"
                onClick={handleOpenGmailWeb}
                className="w-full py-2.5 px-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Gmail Web</span>
              </button>

              <button
                type="button"
                onClick={handleOpenDefaultMailApp}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Open in Default Mail App</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Message Text'}</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-eeu-green text-white text-xs font-bold hover:bg-eeu-green/90 transition-all shadow-md shadow-eeu-green/20 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendEmail} className="p-6 space-y-4.5">
            {/* Rating Stars */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                How is your overall experience?
              </label>
              <div className="flex items-center gap-2 pt-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-hidden cursor-pointer"
                    title={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300 dark:text-gray-700'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 ml-2">
                  {rating === 5 ? 'Excellent 🌟' : rating === 4 ? 'Very Good 👍' : rating === 3 ? 'Good / Average 👌' : rating === 2 ? 'Fair ⚡' : 'Needs Improvement ⚠️'}
                </span>
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Feedback Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-eeu-green font-medium cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Your Thoughts & Suggestions
                </label>
                <span className="text-[11px] text-gray-400">
                  Subject: <b className="text-gray-600 dark:text-gray-300">Website Feedback</b>
                </span>
              </div>
              <textarea
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your experience, suggest a feature, or describe any issue encountered..."
                className="w-full p-3 text-xs rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-eeu-green resize-none font-sans"
              />
            </div>

            {/* Destination Info Pill */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-eeu-green shrink-0" />
                <span className="truncate">Destination: <b className="text-gray-800 dark:text-gray-200">{targetEmail}</b></span>
              </div>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] text-eeu-green hover:underline font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-eeu-green hover:bg-eeu-green/90 rounded-xl transition-all shadow-md shadow-eeu-green/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Sending...' : 'Send to zekariaszenebe21@gmail.com'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

