import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Booking, EQUIPMENTS } from '../types';
import { timeToMinutes, cn } from '../utils';

interface TimelineProps {
  date: Date;
  bookings: Booking[];
  onDeleteBooking: (id: string) => void;
}

const START_HOUR = 6;
const END_HOUR = 18;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const ROW_HEIGHT = 100;
const PIXELS_PER_MINUTE = ROW_HEIGHT / 60;
const TOP_OFFSET = 0;

export function Timeline({ date, bookings, onDeleteBooking }: TimelineProps) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const todaysBookings = bookings.filter(b => b.date === dateStr);

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getTopPx = (time: string) => {
    const mins = timeToMinutes(time);
    const startMins = START_HOUR * 60;
    return Math.max(0, (mins - startMins) * PIXELS_PER_MINUTE) + TOP_OFFSET;
  };

  const getHeightPx = (start: string, end: string) => {
    const startMins = timeToMinutes(start);
    const endMins = timeToMinutes(end);
    return Math.max(0, (endMins - startMins) * PIXELS_PER_MINUTE);
  };

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const showCurrentTime = currentMinutes >= START_HOUR * 60 && currentMinutes <= END_HOUR * 60;
  const currentTopPx = showCurrentTime ? getTopPx(`${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`) : -1;
  const contentHeight = TOTAL_HOURS * ROW_HEIGHT + TOP_OFFSET + 40;

  return (
    <>
      {/* Grid Header */}
      <div className="flex border-b border-slate-200 flex-shrink-0">
        <div className="w-20 border-r border-slate-200"></div>
        <div className="flex-1 grid grid-cols-4">
          {EQUIPMENTS.map((eq, i) => (
            <div key={eq.id} className={cn("p-4 text-center", i < EQUIPMENTS.length - 1 ? "border-r border-slate-100" : "")}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{eq.name}</p>
              <h3 className="font-semibold text-slate-800">{eq.fullName}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Time Grid Content */}
      <div className="relative flex-1 overflow-y-auto overflow-x-hidden flex bg-white">
        {/* Time gutter */}
        <div className="w-20 border-r border-slate-200 flex flex-col bg-slate-50 flex-shrink-0 relative z-10" style={{ minHeight: `${contentHeight}px` }}>
          {hours.map((hour, i) => (
            <div key={hour} className="absolute left-0 right-0" style={{ top: `${i * ROW_HEIGHT + TOP_OFFSET}px` }}>
              <span className={cn(
                "absolute left-0 right-0 text-center text-xs font-mono text-slate-400 px-1",
                i === 0 ? "top-2 bg-transparent" : "-top-2.5 bg-slate-50"
              )}>
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* Main Columns */}
        <div className="flex-1 relative" style={{ minHeight: `${contentHeight}px` }}>
          {/* Horizontal Grid Lines Layer */}
          <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
            {hours.map((hour, i) => (
              <div key={hour} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: `${i * ROW_HEIGHT + TOP_OFFSET}px` }}></div>
            ))}
          </div>

          <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
            {/* Column Dividers */}
            <div className="absolute inset-y-0 left-1/4 w-px bg-slate-100"></div>
            <div className="absolute inset-y-0 left-1/2 w-px bg-slate-100"></div>
            <div className="absolute inset-y-0 left-3/4 w-px bg-slate-100"></div>

            {/* Event Slots */}
            {EQUIPMENTS.map((eq, colIndex) => {
              const eqBookings = todaysBookings.filter(b => b.equipmentId === eq.id);
              
              return (
                <div key={eq.id} className="relative pointer-events-auto col-span-1 min-w-0" style={{ gridColumn: `${colIndex + 1} / span 1` }}>
                  {eqBookings.map(booking => {
                    const top = getTopPx(booking.startTime);
                    const height = getHeightPx(booking.startTime, booking.endTime);
                    
                    return (
                      <div
                        key={booking.id}
                        className={cn(
                          "absolute left-2 right-2 rounded-md p-2 shadow-sm z-10 overflow-hidden group transition-all hover:z-20 hover:shadow-md flex flex-col",
                          eq.color
                        )}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          minHeight: '28px'
                        }}
                      >
                      <div className="flex justify-between items-start gap-1">
                        <p className={cn("text-xs font-bold truncate flex-1", eq.textColor)} title={booking.userName}>{booking.userName}</p>
                        <button 
                          onClick={() => onDeleteBooking(booking.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-black/5 rounded hover:bg-black/10 text-[10px] flex-shrink-0"
                          title="Eliminar reserva"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="flex-1 min-h-0">
                        <p 
                          className={cn("text-[10px] font-medium leading-tight line-clamp-2 mt-0.5 break-words whitespace-normal", eq.subTextColor)}
                          title={booking.purpose || 'Uso de equipo'}
                        >
                          {booking.purpose || 'Uso de equipo'}
                        </p>
                      </div>

                      <p className={cn("text-[10px] mt-0.5 font-mono", eq.timeColor)}>
                        {booking.startTime} — {booking.endTime}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Current Time Indicator */}
          {showCurrentTime && currentTopPx !== -1 && (
            <div 
              className="absolute left-0 w-full flex items-center pointer-events-none z-20"
              style={{ top: `${currentTopPx}px` }}
            >
              <div className="w-2 h-2 rounded-full bg-orange-500 ml-[-4px]"></div>
              <div className="flex-1 h-px bg-orange-500"></div>
              <div className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded ml-[-40px]">
                {format(currentTime, 'HH:mm')}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
}
