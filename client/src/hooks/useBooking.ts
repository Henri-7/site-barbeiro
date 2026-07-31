import { useMemo, useState } from 'react';
import type { BookingState } from '../types/appointment';
import type { Service } from '../types/service';

const initialBookingState: BookingState = {
  service: null,
  date: null,
  startTime: null,
  endTime: null,
  customerName: '',
  customerPhone: '',
  notes: '',
  currentStep: 0
};

export function useBooking() {
  const [booking, setBooking] = useState<BookingState>(initialBookingState);

  const canContinue = useMemo(() => {
    if (booking.currentStep === 0) return Boolean(booking.service);
    if (booking.currentStep === 1) return Boolean(booking.date);
    if (booking.currentStep === 2) return Boolean(booking.startTime);
    return true;
  }, [booking]);

  return {
    booking,
    canContinue,
    setService: (service: Service) =>
      setBooking((current) => ({ ...current, service, startTime: null, endTime: null, currentStep: Math.max(current.currentStep, 0) })),
    setDate: (date: string) => setBooking((current) => ({ ...current, date, startTime: null, endTime: null })),
    setTime: (startTime: string, endTime: string) => setBooking((current) => ({ ...current, startTime, endTime })),
    setCustomer: (customerName: string, customerPhone: string, notes: string) =>
      setBooking((current) => ({ ...current, customerName, customerPhone, notes })),
    goToStep: (step: number) => setBooking((current) => ({ ...current, currentStep: step })),
    nextStep: () => setBooking((current) => ({ ...current, currentStep: Math.min(current.currentStep + 1, 4) })),
    previousStep: () => setBooking((current) => ({ ...current, currentStep: Math.max(current.currentStep - 1, 0) })),
    resetBooking: () => setBooking(initialBookingState)
  };
}
