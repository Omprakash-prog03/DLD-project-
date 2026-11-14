import React, { useState } from 'react';
import { Plus, Check, Trash2, X, Info, CheckSquare, Square } from 'lucide-react';

interface Reminder {
  id: string;
  title: string;
  dueTime: string;
  completed: boolean;
  notes?: string;
}

export const RemindersScreen: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: 'rem-1',
      title: 'Replace DS3231 CR2032 Battery',
      dueTime: 'Tomorrow • 14:00',
      completed: false,
      notes: 'Check cell voltage with multimeter (> 3.0V)',
    },
    {
      id: 'rem-2',
      title: 'Calibrate CD4518 Sync Pulse',
      dueTime: 'Today • 18:30',
      completed: false,
      notes: 'Ensure 10us HIGH pulse on GPIO 26 via 74HCT245',
    },
    {
      id: 'rem-3',
      title: 'Verify 2.4kHz Buzzer Resonant Frequency',
      dueTime: 'Yesterday',
      completed: true,
      notes: 'PWM duty cycle set to 50% (128/255)',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dueTime, setDueTime] = useState('Tomorrow • 10:00');
  const [notes, setNotes] = useState('');

  const toggleReminder = (id: string) => {
    setReminders(
      reminders.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    setReminders([
      ...reminders,
      {
        id: `rem-${Date.now()}`,
        title: title.trim(),
        dueTime,
        completed: false,
        notes: notes.trim(),
      },
    ]);
    setTitle('');
    setNotes('');
    setIsModalOpen(false);
  };

  const activeList = reminders.filter((r) => !r.completed);
  const completedList = reminders.filter((r) => r.completed);

  return (
    <div className="flex-1 overflow-y-auto px-[18px] py-4 space-y-4 no-scrollbar">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-[28px] font-bold text-white tracking-tight">Reminders</h1>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-10 h-10 rounded-full bg-[#3B5BDB] flex items-center justify-center text-white hover:bg-blue-600 transition shadow-md"
        >
          <Plus size={22} />
        </button>
      </div>

      {/* Software-only Notice Banner */}
      <div className="bg-[#1E1E1E] border-l-4 border-[#3B5BDB] rounded-xl p-3 text-xs text-neutral-300 flex items-start gap-2.5">
        <Info size={16} className="text-[#3B5BDB] shrink-0 mt-0.5" />
        <span>
          Reminders use your phone&apos;s notification system. They are software-only and
          independent of your physical hardware clock.
        </span>
      </div>

      {/* Active Tasks */}
      {activeList.length > 0 && (
        <div>
          <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2.5">
            UPCOMING TASKS
          </p>
          <div className="space-y-2.5">
            {activeList.map((r) => (
              <div
                key={r.id}
                onClick={() => toggleReminder(r.id)}
                className="cursor-pointer bg-[#1E1E1E] rounded-[20px] p-4 border-l-4 border-[#3B5BDB] flex items-center justify-between transition hover:bg-[#252525]"
              >
                <div className="pr-3">
                  <span className="text-[11px] text-neutral-400 font-medium">{r.dueTime}</span>
                  <h4 className="text-[15px] font-bold text-white mt-0.5">{r.title}</h4>
                  {r.notes && <p className="text-[12px] text-neutral-400 mt-0.5">{r.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleReminder(r.id);
                  }}
                  className="text-neutral-400 hover:text-[#3B5BDB] transition"
                >
                  <Square size={22} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedList.length > 0 && (
        <div className="pt-2">
          <p className="text-[12px] font-bold text-neutral-400 tracking-wider mb-2.5">COMPLETED</p>
          <div className="space-y-2.5">
            {completedList.map((r) => (
              <div
                key={r.id}
                className="bg-[#1E1E1E]/60 rounded-[20px] p-4 border-l-4 border-neutral-600 flex items-center justify-between"
              >
                <div className="pr-3 line-through text-neutral-500">
                  <span className="text-[11px] font-medium">{r.dueTime}</span>
                  <h4 className="text-[15px] font-bold mt-0.5">{r.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleReminder(r.id)}
                    className="text-[#2ECC71]"
                  >
                    <CheckSquare size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReminder(r.id)}
                    className="text-neutral-600 hover:text-red-500 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-[#171717] rounded-t-[28px] p-5 space-y-4 border-t border-[#2A2A2A]">
            <div className="flex items-center justify-between pb-1 border-b border-[#2A2A2A]">
              <h2 className="text-xl font-bold text-white">New Reminder</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-neutral-400 block mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Check CR2032 battery, pulse width..."
                className="w-full bg-[#1E1E1E] rounded-xl px-4 py-3 text-white text-[15px] outline-none"
              />
            </div>

            <div>
              <label className="text-[13px] font-semibold text-neutral-400 block mb-1">Due</label>
              <input
                type="text"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full bg-[#1E1E1E] rounded-xl px-4 py-3 text-white text-[15px] outline-none"
              />
            </div>

            <div>
              <label className="text-[13px] font-semibold text-neutral-400 block mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes or instructions..."
                className="w-full bg-[#1E1E1E] rounded-xl px-4 py-2 text-white text-sm outline-none resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleCreate}
              className="w-full bg-[#3B5BDB] text-white font-bold py-3.5 rounded-xl text-base shadow-md hover:bg-blue-600 transition"
            >
              Save Reminder
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
