import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { appointmentSchema, type AppointmentFormData } from '../../schemas/appointment.schema';
import type { BookingState } from '../../types/appointment';
import { maskPhone } from '../../utils/phone';

type CustomerStepProps = {
  booking: BookingState;
  onSubmit: (data: AppointmentFormData) => void;
};

export function CustomerStep({ booking, onSubmit }: CustomerStepProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    mode: 'onChange',
    defaultValues: {
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      notes: booking.notes
    }
  });

  return (
    <form className="step-panel customer-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h3>Informe seus dados</h3>
      <label>
        Nome completo *
        <input type="text" autoComplete="name" {...register('customerName')} />
        {errors.customerName ? <span role="alert">{errors.customerName.message}</span> : null}
      </label>
      <label>
        Telefone com DDD *
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          {...register('customerPhone')}
          onChange={(event) => setValue('customerPhone', maskPhone(event.target.value), { shouldValidate: true })}
        />
        {errors.customerPhone ? <span role="alert">{errors.customerPhone.message}</span> : null}
      </label>
      <label>
        Observações
        <textarea rows={4} maxLength={280} {...register('notes')} />
        {errors.notes ? <span role="alert">{errors.notes.message}</span> : null}
      </label>
      <button className="btn btn-primary" type="submit">
        Revisar solicitação
      </button>
    </form>
  );
}
