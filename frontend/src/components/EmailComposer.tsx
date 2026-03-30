import { useState, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Send, Sparkles, FileText, X, Check, Loader2 } from 'lucide-react';
import type { Student } from '../api';
import { sendEmail, generateEmail } from '../api';

interface Props {
  selectedStudents: Student[];
  onClose: () => void;
}

const TEMPLATES = [
  {
    name: 'Missing Assessment Reminder',
    subject: 'Action Required: Outstanding Assessment - {{course_name}}',
    body: `<p>Dear {{first_name}},</p>
<p>I hope this message finds you well. I'm writing to let you know that our records indicate you have not yet submitted one or more assessments for Web Information Systems (WIS2002).</p>
<p>It's important that you complete these assessments to stay on track with the course requirements. If you're experiencing any difficulties, please don't hesitate to reach out — we're here to support you.</p>
<p>Please review your outstanding items and submit them at your earliest convenience.</p>
<p>Kind regards,<br/>Course Coordinator<br/>Web Information Systems (WIS2002)</p>`,
  },
  {
    name: 'Low Engagement Alert',
    subject: 'Checking In - {{course_name}}',
    body: `<p>Dear {{first_name}},</p>
<p>I've noticed that your engagement with the course materials for Web Information Systems has been lower than usual recently. I wanted to check in and see if everything is okay.</p>
<p>Regular engagement with weekly activities and applied classes is key to success in this course. If you're facing any challenges — whether academic, personal, or technical — please let me know so we can work together to find a solution.</p>
<p>You can also visit the Student Support Services for additional help.</p>
<p>Best wishes,<br/>Course Coordinator<br/>Web Information Systems (WIS2002)</p>`,
  },
  {
    name: 'Congratulations - Strong Performance',
    subject: 'Great Work in {{course_name}}!',
    body: `<p>Dear {{first_name}},</p>
<p>I wanted to take a moment to acknowledge your excellent work in Web Information Systems (WIS2002). Your consistent engagement and strong assessment results have been impressive.</p>
<p>Keep up the fantastic effort! If you're interested in extending your learning, I'd be happy to suggest some additional resources or opportunities.</p>
<p>Well done!</p>
<p>Best regards,<br/>Course Coordinator<br/>Web Information Systems (WIS2002)</p>`,
  },
  {
    name: 'Applied Class Reminder',
    subject: 'Upcoming Applied Class - {{course_name}}',
    body: `<p>Dear {{first_name}},</p>
<p>This is a friendly reminder about the upcoming applied class for Web Information Systems (WIS2002). Applied classes are an essential component of your learning experience and contribute to your overall course engagement.</p>
<p>Please ensure you come prepared and ready to participate. If you're unable to attend, please let me know in advance.</p>
<p>See you there!</p>
<p>Kind regards,<br/>Course Coordinator<br/>Web Information Systems (WIS2002)</p>`,
  },
];

const PLACEHOLDERS = [
  '{{first_name}}', '{{last_name}}', '{{username}}',
  '{{email}}', '{{degree_program}}',
];

export default function EmailComposer({ selectedStudents, onClose }: Props) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  const handleSend = async () => {
    setSending(true);
    try {
      const emails = selectedStudents.map(s => s.email);
      await sendEmail(emails, subject, body);
      setSent(true);
      setTimeout(() => { onClose(); }, 2000);
    } finally {
      setSending(false);
    }
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    setAiError('');
    try {
      const context = `${selectedStudents.length} students selected. Programs: ${[...new Set(selectedStudents.map(s => s.degree_program))].join(', ')}`;
      const result = await generateEmail(aiPrompt, context);
      setBody(result.content.replace(/\n/g, '<br/>'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('API key') || (typeof err === 'object' && err !== null && 'response' in err)) {
        setAiError('OpenAI API key not configured. Add OPENAI_API_KEY to backend/.env file.');
      } else {
        setAiError('Failed to generate email. ' + msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setSubject(template.subject);
    setBody(template.body);
    setShowTemplates(false);
  };

  const insertPlaceholder = (placeholder: string) => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const range = editor.getSelection(true);
      editor.insertText(range.index, placeholder);
    }
  };

  if (sent) {
    return (
      <div className="bg-white rounded-xl border border-green-200 shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
          <Check size={24} className="text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Email Sent (Simulated)</h3>
        <p className="text-sm text-slate-500 mt-1">
          Successfully sent to {selectedStudents.length} recipient(s)
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">
          Compose Email ({selectedStudents.length} recipient{selectedStudents.length !== 1 ? 's' : ''})
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Templates & AI */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <FileText size={14} /> Templates
            </button>
            {showTemplates && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg border border-slate-200 shadow-lg z-10">
                {TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(t)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Generation */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={14} className="text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">AI Email Assistant</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="Describe the email you want to write..."
              className="flex-1 text-sm border border-indigo-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !aiPrompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generate
            </button>
          </div>
          {aiError && <p className="text-xs text-red-600 mt-2">{aiError}</p>}
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Email subject..."
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Placeholders */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500">Insert placeholder:</span>
          {PLACEHOLDERS.map(p => (
            <button
              key={p}
              onClick={() => insertPlaceholder(p)}
              className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors font-mono"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Rich Text Editor */}
        <ReactQuill
          ref={quillRef}
          value={body}
          onChange={setBody}
          theme="snow"
          modules={{
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link'],
              ['clean'],
            ],
          }}
        />

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send Email (Simulated)
          </button>
        </div>
      </div>
    </div>
  );
}
