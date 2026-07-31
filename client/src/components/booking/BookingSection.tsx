import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createAppointment } from '../../services/appointments.api';
import type { AppointmentResult } from '../../types/appointment';
import type { AvailabilitySlot } from '../../types/availability';
import type { Service } from '../../types/service';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { Modal } from '../common/Modal';
import { SectionHeading } from '../common/SectionHeading';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { BookingStepper } from './BookingStepper';
import { BookingSummary } from './BookingSummary';
import { CustomerStep } from './CustomerStep';
import { DateStep } from './DateStep';
import { ReviewStep } from './ReviewStep';
import { ServiceStep } from './ServiceStep';
import { TimeStep } from './TimeStep';
import { useBooking } from '../../hooks/useBooking';
import type { AppointmentFormData } from '../../schemas/appointment.schema';

type BookingSectionProps = {
  services: Service[];
  selectedService: Service | null;
  onSelectedServiceChange: (service: Service | null) => void;
};

function getBarbershopWhatsAppLink(result: AppointmentResult) {
  return buildWhatsAppUrl(result.summary);
}

function openWhatsApp(link: string) {
  if (!link) return;

  const opened = window.open(link, '_blank', 'noopener,noreferrer');

  if (!opened) {
    window.location.href = link;
  }
}

export function BookingSection({ services, selectedService, onSelectedServiceChange }: BookingSectionProps) {
  const bookingFlow = useBooking();
  const { booking } = bookingFlow;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [result, setResult] = useState<AppointmentResult | null>(null);

  useEffect(() => {
    if (selectedService && booking.service?.id !== selectedService.id) {
      bookingFlow.setService(selectedService);
      bookingFlow.goToStep(0);
    }
  }, [selectedService, booking.service?.id]);

  function selectService(service: Service) {
    bookingFlow.setService(service);
    onSelectedServiceChange(service);
  }

  function continueFromSimpleStep() {
    if (bookingFlow.canContinue) {
      bookingFlow.nextStep();
    }
  }

  function saveCustomer(data: AppointmentFormData) {
    bookingFlow.setCustomer(data.customerName, data.customerPhone, data.notes || '');
    bookingFlow.nextStep();
  }

  async function submitAppointment() {
    if (!booking.service || !booking.date || !booking.startTime) return;
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSuggestions([]);
      const response: AppointmentResult = await createAppointment({
        serviceId: booking.service.id,
        appointmentDate: booking.date,
        startTime: booking.startTime,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        notes: booking.notes
      });
      setResult(response);
      openWhatsApp(getBarbershopWhatsAppLink(response));
    } catch (error) {
      const typedError = error as Error & { details?: { suggestions?: string[] } };
      setSubmitError(typedError.message);
      setSuggestions(typedError.details?.suggestions || []);
    } finally {
      setIsSubmitting(false);
    }
  }

  function closeSuccess() {
    setResult(null);
    onSelectedServiceChange(null);
    bookingFlow.resetBooking();
  }

  const stepContent = [
    <ServiceStep key="service" services={services} selectedServiceId={booking.service?.id} onSelect={selectService} />,
    <DateStep key="date" selectedDate={booking.date} onSelectDate={bookingFlow.setDate} />,
    <TimeStep
      key="time"
      date={booking.date}
      serviceId={booking.service?.id || null}
      selectedTime={booking.startTime}
      onSelectDate={bookingFlow.setDate}
      onChooseAnotherDate={() => bookingFlow.goToStep(1)}
      onSelectTime={(slot: AvailabilitySlot) => bookingFlow.setTime(slot.time, slot.endTime)}
    />,
    <CustomerStep key="customer" booking={booking} onSubmit={saveCustomer} />,
    <ReviewStep key="review" booking={booking} isSubmitting={isSubmitting} error={submitError} suggestions={suggestions} onEdit={bookingFlow.goToStep} onSubmit={submitAppointment} />
  ];
  const barbershopWhatsAppLink = result ? getBarbershopWhatsAppLink(result) : '';

  return (
    <section className="section booking-section" id="booking">
      <SectionHeading eyebrow="Agendamento" title="Reserve seu horário." text="Escolha o atendimento, informe seus dados e envie a confirmação pelo WhatsApp." />
      <div className="booking-layout">
        <div className="booking-card">
          <BookingStepper currentStep={booking.currentStep} />
          <AnimatePresence mode="wait">
            <motion.div key={booking.currentStep} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
              {stepContent[booking.currentStep]}
            </motion.div>
          </AnimatePresence>
          {booking.currentStep < 3 ? (
            <div className="step-actions">
              <button className="btn btn-ghost" type="button" disabled={booking.currentStep === 0} onClick={bookingFlow.previousStep}>
                Voltar
              </button>
              <button className="btn btn-primary" type="button" disabled={!bookingFlow.canContinue} onClick={continueFromSimpleStep}>
                Continuar
              </button>
            </div>
          ) : null}
          {booking.currentStep === 3 ? (
            <div className="step-actions">
              <button className="btn btn-ghost" type="button" onClick={bookingFlow.previousStep}>
                Voltar
              </button>
            </div>
          ) : null}
          {booking.currentStep > 3 ? (
            <div className="step-actions">
              <button className="btn btn-ghost" type="button" onClick={bookingFlow.previousStep}>
                Voltar
              </button>
            </div>
          ) : null}
        </div>
        <BookingSummary booking={booking} />
      </div>
      <Modal isOpen={Boolean(result)} title="Horário agendado" onClose={closeSuccess}>
        {result ? (
          <div className="success-content">
            <p>Seu pedido foi salvo. O WhatsApp abre com a mensagem pronta para a barbearia.</p>
            <p>
              <strong>{result.summary.service}</strong> em {result.summary.appointmentDate}, das {result.summary.startTime} às {result.summary.endTime}.
            </p>
            {barbershopWhatsAppLink ? (
              <a className="btn btn-primary" href={barbershopWhatsAppLink} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon size={18} />
                Enviar mensagem
              </a>
            ) : null}
            <button className="btn btn-secondary" type="button" onClick={closeSuccess}>
              Novo agendamento
            </button>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
