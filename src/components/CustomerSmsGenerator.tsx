import React, { useState, useEffect } from 'react';
import { MessageSquare, Gauge, Copy, Check, X, AlertCircle } from 'lucide-react';

/**
 * Robust clipboard copy helper supporting iframe sandbox environments
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Navigator clipboard API failed, attempting fallback...', err);
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed: ', err);
    return false;
  }
}

/**
 * 1. Customer SMS Generator (Complaint / Ticket Number)
 */
export function CustomerSmsGenerator() {
  const [ticketInput, setTicketInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Clear copied state after timeout
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const trimmedTicket = ticketInput.trim();
  const isEmpty = trimmedTicket.length === 0;
  const isNumbersOnly = /^\d+$/.test(trimmedTicket);
  const isExact10Digits = isNumbersOnly && trimmedTicket.length === 10;
  const isValid = isExact10Digits;

  // Validation message determination
  let validationMessage = '';
  if (isEmpty) {
    validationMessage = 'Please enter a complaint/ticket number.';
  } else if (!isNumbersOnly) {
    validationMessage = 'Ticket number must contain numbers only.';
  } else if (trimmedTicket.length !== 10) {
    validationMessage = `Ticket number must be exactly 10 digits. (${trimmedTicket.length}/10)`;
  }

  // Exact generated message template
  const generatedSms = isValid
    ? `Dear Customer, your service request has been assigned Ticket ID: ${trimmedTicket}. A technician will be dispatched to your location shortly. For inquiries, please call our 905 helplines.`
    : '';

  const handleCopy = async () => {
    if (!isValid || !generatedSms) return;
    const success = await copyToClipboard(generatedSms);
    if (success) {
      setCopied(true);
    }
  };

  const handleClear = () => {
    setTicketInput('');
    setCopied(false);
  };

  return (
    <div
      id="customer-sms-generator-card"
      className="glass-card rounded-3xl p-5 border border-gray-250/50 dark:border-gray-850/70 space-y-4 shadow-sm flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-150/60 dark:border-gray-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 text-eeu-green flex items-center justify-center font-bold">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-gray-950 dark:text-white text-base tracking-tight leading-tight flex items-center gap-2">
                Complaint / Ticket Number
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-sans">
                Service request & complaint ticket notification
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="complaint-ticket-input"
              className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-sans"
            >
              Complaint / Ticket Number
            </label>
            {ticketInput && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-semibold text-gray-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="Clear input"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="relative">
            <input
              id="complaint-ticket-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              value={ticketInput}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setTicketInput(digits);
              }}
              placeholder="Enter complaint number"
              className="w-full text-xs rounded-xl glass-input py-2.5 px-3.5 pr-8 text-gray-900 dark:text-white font-sans font-medium placeholder:text-gray-400 focus:outline-none focus:ring-1.5 focus:ring-eeu-green transition-all"
            />
            {ticketInput && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Validation Notice */}
          {!isValid && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{validationMessage}</span>
            </p>
          )}
        </div>

        {/* SMS Preview Area */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-sans">
              SMS Preview
            </span>
            {isValid && (
              <span className="text-[10.5px] font-mono text-gray-400 dark:text-gray-400">
                {generatedSms.length} chars
              </span>
            )}
          </div>

          <div
            id="ticket-sms-preview-box"
            className={`p-3.5 rounded-2xl text-xs leading-relaxed transition-all min-h-[78px] flex items-center ${
              isValid
                ? 'bg-emerald-500/[0.04] dark:bg-emerald-950/20 border border-emerald-500/25 text-gray-800 dark:text-gray-200'
                : 'bg-gray-100/60 dark:bg-gray-900/40 border border-dashed border-gray-250 dark:border-gray-800 text-gray-400 dark:text-gray-400 italic'
            }`}
          >
            {isValid ? (
              <p className="font-sans">
                Dear Customer, your service request has been assigned Ticket ID:{' '}
                <strong className="font-mono font-bold text-eeu-green bg-emerald-500/15 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {trimmedTicket}
                </strong>
                . A technician will be dispatched to your location shortly. For inquiries, please call our 905 helplines.
              </p>
            ) : (
              <p className="text-center w-full">
                Enter a 10-digit ticket number above to generate the customer SMS message.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer with Copy Button */}
      <div className="pt-2">
        <button
          id="copy-ticket-sms-btn"
          type="button"
          disabled={!isValid}
          onClick={handleCopy}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer ${
            copied
              ? 'bg-emerald-600 text-white shadow-md'
              : isValid
              ? 'bg-eeu-green hover:bg-[#056924] text-white shadow-sm hover:shadow active:scale-[0.99]'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-400 cursor-not-allowed opacity-75'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>✓ SMS Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy SMS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * 2. Smart Meter Token SMS Generator (20-Digit Token)
 */
export function SmartMeterTokenSmsGenerator() {
  const [tokenInput, setTokenInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Clear copied state after timeout
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Extract raw digits ignoring internal and outer spaces
  const digitsOnly = tokenInput.replace(/\s+/g, '');
  const isEmpty = tokenInput.trim().length === 0;
  const isNumbersOnly = isEmpty || /^\d+$/.test(digitsOnly);
  const hasInvalidCharacters = !isEmpty && !/^[0-9\s]+$/.test(tokenInput);
  const isExact20Digits = /^\d{20}$/.test(digitsOnly);

  // Format with spaces into groups of 4: "1105 6270 9498 0854 2229"
  const formattedToken = digitsOnly.match(/.{1,4}/g)?.join(' ') || digitsOnly;

  // Validation message determination:
  let validationMessage = '';
  if (isEmpty) {
    validationMessage = 'Please enter the smart meter token number.';
  } else if (hasInvalidCharacters) {
    validationMessage = 'Token number must contain numbers only.';
  } else if (digitsOnly.length !== 20) {
    validationMessage = `Smart meter token must be exactly 20 digits. (${digitsOnly.length}/20)`;
  }

  // Exact generated message template formatted as 4-digit groups
  const generatedSms = isExact20Digits
    ? `Dear Customer, your smart meter token number is: ${formattedToken}. Please enter the token into your meter to recharge your electricity service. For inquiries, please call our 905 helplines.`
    : '';

  const handleCopy = async () => {
    if (!isExact20Digits || !generatedSms) return;
    const success = await copyToClipboard(generatedSms);
    if (success) {
      setCopied(true);
    }
  };

  const handleClear = () => {
    setTokenInput('');
    setCopied(false);
  };

  return (
    <div
      id="smart-meter-token-sms-card"
      className="glass-card rounded-3xl p-5 border border-gray-250/50 dark:border-gray-850/70 space-y-4 shadow-sm flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-150/60 dark:border-gray-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/10 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-gray-950 dark:text-white text-base tracking-tight leading-tight flex items-center gap-2">
                Smart Meter Token SMS
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-sans">
                20-digit prepaid meter recharge token
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="smart-meter-token-input"
              className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-sans"
            >
              Smart Meter Token Number
            </label>
            {tokenInput && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-semibold text-gray-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="Clear input"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="relative">
            <input
              id="smart-meter-token-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={24}
              value={tokenInput}
              onChange={(e) => {
                // Strip spaces and keep only digits up to 20
                const rawDigits = e.target.value.replace(/\s+/g, '').replace(/\D/g, '').slice(0, 20);
                // Auto format into 4-digit blocks: 1105 6270 9498 0854 2229
                const formatted = rawDigits.match(/.{1,4}/g)?.join(' ') || rawDigits;
                setTokenInput(formatted);
              }}
              placeholder="Enter Token Number"
              className="w-full text-xs rounded-xl glass-input py-2.5 px-3.5 pr-8 text-gray-900 dark:text-white font-sans font-medium placeholder:text-gray-400 focus:outline-none focus:ring-1.5 focus:ring-sky-500 transition-all font-mono tracking-wider"
            />
            {tokenInput && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Validation Notice */}
          {!isExact20Digits && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{validationMessage}</span>
            </p>
          )}
        </div>

        {/* SMS Preview Area */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-sans">
              SMS Preview
            </span>
            {isExact20Digits && (
              <span className="text-[10.5px] font-mono text-gray-400 dark:text-gray-400">
                {generatedSms.length} chars
              </span>
            )}
          </div>

          <div
            id="token-sms-preview-box"
            className={`p-3.5 rounded-2xl text-xs leading-relaxed transition-all min-h-[78px] flex items-center ${
              isExact20Digits
                ? 'bg-sky-500/[0.04] dark:bg-sky-950/20 border border-sky-500/25 text-gray-800 dark:text-gray-200'
                : 'bg-gray-100/60 dark:bg-gray-900/40 border border-dashed border-gray-250 dark:border-gray-800 text-gray-400 dark:text-gray-400 italic'
            }`}
          >
            {isExact20Digits ? (
              <p className="font-sans">
                Dear Customer, your smart meter token number is:{' '}
                <strong className="font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/15 dark:bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/20 tracking-wider">
                  {formattedToken}
                </strong>
                . Please enter the token into your meter to recharge your electricity service. For inquiries, please call our 905 helplines.
              </p>
            ) : (
              <p className="text-center w-full">
                Enter a 20-digit token number above to generate the customer recharge SMS.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer with Copy Button */}
      <div className="pt-2">
        <button
          id="copy-token-sms-btn"
          type="button"
          disabled={!isExact20Digits}
          onClick={handleCopy}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer ${
            copied
              ? 'bg-sky-600 text-white shadow-md'
              : isExact20Digits
              ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm hover:shadow active:scale-[0.99]'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-400 cursor-not-allowed opacity-75'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>✓ SMS Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy SMS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * 3. Full Tab Component for "SMS Ticket Generator"
 */
export default function SmsTicketGenerator() {
  return (
    <div id="sms-ticket-generator-tab" className="space-y-6 animate-in fade-in-40 duration-200">
      {/* Two-Column Grid for Generators */}
      <div id="call-center-sms-tools-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Customer SMS Generator */}
        <CustomerSmsGenerator />
        {/* Right: Smart Meter Token SMS */}
        <SmartMeterTokenSmsGenerator />
      </div>
    </div>
  );
}
