import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const StudentCalendar = () => {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentDate.getMonth(), 1).getDay();
    const lastDate = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="text-center p-2"></div>);
    }

    for (let i = 1; i <= lastDate; i++) {
      const isToday = i === currentDate.getDate();
      days.push(
        <div
          key={i}
          className={`text-center p-2 ${
            isToday ? 'bg-orange-500 text-white rounded-full' : ''
          }`}
        >
          {i}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{`${currentMonth} ${currentYear}`}</h2>
        <div className="flex space-x-2">
          <button className="p-1 rounded-full hover:bg-gray-200">
            <ChevronLeft size={20} />
          </button>
          <button className="p-1 rounded-full hover:bg-gray-200">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div key={day} className="text-center font-medium text-gray-500">
            {day}
          </div>
        ))}
        {generateCalendarDays()}
      </div>
    </div>
  );
};

export default StudentCalendar;