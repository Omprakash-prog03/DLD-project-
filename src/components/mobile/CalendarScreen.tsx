import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  time: string;
  date: number; // Day of month
  category: 'Personal' | 'Work' | 'Study' | 'General';
  color: string;
}

export const CalendarScreen: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 14)); // Nov 14, 2026
  const [selectedDay, setSelectedDay] = useState(14);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTime, setNewTime] = useState('14:00 - 15:30');
  const [newCategory, setNewCategory] = useState<'Personal' | 'Work' | 'Study' | 'General'>('Study');

  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 'evt-1',
      title: 'Digital Systems Review',
      description: 'Review CD4518 cascade counter timing and propagation delays',
      time: '10:00 - 11:30',
      date: 14,
      category: 'Study',
      color: '#3B5BDB',
    },
    {
      id: 'evt-2',
      title: 'Firmware Bench Testing',
      description: 'Verify 3.3V logic thresholds and I2C pullup signals with oscilloscope',
      time: '14:00 - 15:30',
      date: 14,
      category: 'Work',
      color: '#7B2DBF',
    },
    {
      id: 'evt-3',
      title: 'Hardware Lab Workshop',
      description: 'Solder 74HCT245 bus buffer circuit and DS3231 module',
      time: '09:00 - 11:00',
      date: 15,
      category: 'Study',
      color: '#1A9B8C',
    },
  ]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleCreateEvent = () => {
    if (!newTitle.trim()) return;
    const catColors = {
      Personal: '#3B5BDB',
      Work: '#7B2DBF',
      Study: '#1A9B8C',
      General: '#666666',
    };

    setEvents([
      ...events,
      {
        id: `evt-${Date.now()}`,
        title: newTitle.trim(),
        description: newDesc.trim(),
        time: newTime,
        date: selectedDay,
        category: newCategory,
        color: catColors[newCategory],
      },
    ]);

    setNewTitle('');
    setNewDesc('');
    setIsModalOpen(false);
  };

  const dayEvents = events.filter((e) => e.date === selectedDay);

  return (
    <div className="flex-1 overflow-y-auto px-[18px] py-4 space-y-4 no-scrollbar">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-[28px] font-bold text-white tracking-tight">
          {monthNames[month]} {year}
        </h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 text-neutral-400 hover:text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 text-neutral-400 hover:text-white"
          >
            <ChevronRight size={24} />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-8 h-8 rounded-full bg-[#3B5BDB] flex items-center justify-center text-white ml-2 hover:bg-blue-600 transition"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* View Switcher Chips (Month / Week / Agenda) */}
      <div className="flex gap-2">
        {(['month', 'week', 'agenda'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition ${
              viewMode === mode
                ? 'bg-[#3B5BDB] text-white shadow-sm'
                : 'bg-[#2A2A2A] text-neutral-400'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Calendar Month Grid */}
      <div className="bg-[#1E1E1E] rounded-[24px] p-4">
        {/* Weekday Labels */}
        <div className="grid grid-cols-7 text-center mb-2">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
            <span key={d} className="text-[12px] font-bold text-neutral-500 py-1">
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isToday = dayNum === 14;
            const isSelected = dayNum === selectedDay;
            const hasEvent = events.some((e) => e.date === dayNum);

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(dayNum)}
                className={`h-9 rounded-full flex flex-col items-center justify-center text-sm font-bold transition relative ${
                  isToday
                    ? 'bg-[#E84B2F] text-white'
                    : isSelected
                    ? 'border-2 border-[#E84B2F] text-white bg-[#E84B2F]/20'
                    : 'text-neutral-300 hover:bg-[#2A2A2A]'
                }`}
              >
                <span>{dayNum}</span>
                {hasEvent && (
                  <span
                    className={`w-1 h-1 rounded-full absolute bottom-1 ${
                      isToday ? 'bg-white' : 'bg-[#3B5BDB]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda Header */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="text-[18px] font-bold text-white">
          Events for {monthNames[month]} {selectedDay}
        </h3>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-bold text-[#3B5BDB] hover:underline"
        >
          + Add Event
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-3 pb-6">
        {dayEvents.length === 0 ? (
          <div className="bg-[#1E1E1E] rounded-2xl p-6 text-center text-neutral-400 text-sm">
            No events scheduled for this day.
          </div>
        ) : (
          dayEvents.map((event) => (
            <div
              key={event.id}
              className="bg-[#1E1E1E] rounded-[20px] p-4 border-l-4 flex flex-col justify-between"
              style={{ borderLeftColor: event.color }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[12px] text-neutral-400 font-medium">{event.time}</span>
                  <h4 className="text-[16px] font-bold text-white mt-0.5">{event.title}</h4>
                  <p className="text-[13px] text-neutral-400 mt-1">{event.description}</p>
                </div>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${event.color}33`,
                    color: event.color,
                  }}
                >
                  {event.category}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-[#171717] rounded-t-[28px] max-h-[85vh] overflow-y-auto p-5 space-y-4 border-t border-[#2A2A2A]">
            <div className="flex items-center justify-between pb-1 border-b border-[#2A2A2A]">
              <h2 className="text-xl font-bold text-white">New Calendar Event</h2>
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
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Hardware Lab, Circuit Testing..."
                className="w-full bg-[#1E1E1E] rounded-xl px-4 py-3 text-white text-[15px] outline-none"
              />
            </div>

            <div>
              <label className="text-[13px] font-semibold text-neutral-400 block mb-1">Time</label>
              <input
                type="text"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-[#1E1E1E] rounded-xl px-4 py-3 text-white text-[15px] outline-none"
              />
            </div>

            <div>
              <label className="text-[13px] font-semibold text-neutral-400 block mb-1">Category</label>
              <div className="flex gap-2">
                {(['Study', 'Work', 'Personal', 'General'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      newCategory === cat
                        ? 'bg-[#3B5BDB] text-white shadow-sm'
                        : 'bg-[#2A2A2A] text-neutral-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-neutral-400 block mb-1">Description</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                placeholder="Details, pinouts, test procedures..."
                className="w-full bg-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm outline-none resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleCreateEvent}
              className="w-full bg-[#3B5BDB] text-white font-bold py-3.5 rounded-xl text-base shadow-md hover:bg-blue-600 transition"
            >
              Save Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
