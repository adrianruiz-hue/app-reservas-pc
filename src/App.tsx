/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { addDays, subDays, format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from './types';
import { Timeline } from './components/Timeline';
import { BookingModal } from './components/BookingModal';
import { db, auth } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Authenticate and load from Firestore
  useEffect(() => {
    // We don't need anonymous auth since rules are open
    const unsubscribeSnapshot = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const loadedBookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
      setBookings(loadedBookings);
      setIsLoaded(true);
    }, (error: any) => {
      console.error("Error fetching bookings:", error);
      alert(`Error fetching bookings: ${error.message}`);
    });

    return () => unsubscribeSnapshot();
  }, []);

  const handlePrevDay = () => setCurrentDate(prev => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleSaveBooking = async (newBooking: Omit<Booking, 'id'>) => {
    try {
      await addDoc(collection(db, 'bookings'), newBooking);
      
      // Notify via webhook
      fetch('/api/notify-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking: newBooking })
      }).catch(err => console.error("Error triggering webhook:", err));

    } catch (e: any) {
      console.error("Error adding document: ", e);
      alert(`Error al guardar la reserva: ${e.message}`);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
      try {
        await deleteDoc(doc(db, 'bookings', id));
      } catch (e) {
        console.error("Error deleting document: ", e);
        alert("Error al eliminar la reserva");
      }
    }
  };

  const calculateOccupancy = (equipmentId: string) => {
    const todaysBookings = bookings.filter(b => 
      b.date === format(currentDate, 'yyyy-MM-dd') && b.equipmentId === equipmentId
    );
    let totalMinutes = 0;
    todaysBookings.forEach(b => {
      if (!b.startTime || !b.endTime) return;
      const startParts = b.startTime.split(':');
      const endParts = b.endTime.split(':');
      if (startParts.length !== 2 || endParts.length !== 2) return;
      
      const start = Number(startParts[0]) * 60 + Number(startParts[1]);
      const end = Number(endParts[0]) * 60 + Number(endParts[1]);
      if (!isNaN(start) && !isNaN(end)) {
        totalMinutes += (end - start);
      }
    });
    const maxMinutes = (18 - 8) * 60; // 08:00 to 18:00
    const percentage = Math.round((totalMinutes / maxMinutes) * 100);
    return Math.min(100, Math.max(0, percentage || 0));
  };

  return (
    <div className="h-screen w-full bg-[#F8FAFC] flex flex-col font-sans overflow-hidden text-slate-900">
      {/* Header Navigation */}
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-800">
            LabFlow <span className="font-normal text-slate-400">/ Equipment Scheduler</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleToday}
              className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
              <button 
                onClick={handlePrevDay}
                className="p-1 hover:bg-white rounded-md text-slate-500 transition-colors shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="w-48 text-center text-sm font-medium capitalize select-none text-slate-700">
                {format(currentDate, "EEEE, MMM d, yyyy")}
              </div>
              <button 
                onClick={handleNextDay}
                className="p-1 hover:bg-white rounded-md text-slate-500 transition-colors shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            + New Booking
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Info */}
        <aside className="w-64 border-r border-slate-200 bg-white p-6 flex flex-col gap-8 flex-shrink-0">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Selected Day</p>
            <div className="text-2xl font-light text-slate-800 capitalize">{format(currentDate, 'EEEE')}</div>
            <div className="text-3xl font-bold text-indigo-600 capitalize">{format(currentDate, 'MMM d')}</div>
          </div>
          
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Occupancy</p>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Equipo 01</span>
                  <span className="font-bold">{calculateOccupancy('eq-1')}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${calculateOccupancy('eq-1')}%` }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Equipo 02</span>
                  <span className="font-bold">{calculateOccupancy('eq-2')}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${calculateOccupancy('eq-2')}%` }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Equipo 03</span>
                  <span className="font-bold">{calculateOccupancy('eq-3')}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${calculateOccupancy('eq-3')}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700 uppercase mb-2">Pro Tip</p>
            <p className="text-xs leading-relaxed text-indigo-600">Use this tool to coordinate shared equipment without overlapping times.</p>
          </div>
        </aside>

        {/* Calendar Grid Area */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          <Timeline 
            date={currentDate} 
            bookings={bookings} 
            onDeleteBooking={handleDeleteBooking}
          />
        </main>
      </div>

      <BookingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBooking}
        existingBookings={bookings}
        selectedDate={currentDate}
      />
    </div>
  );
}
