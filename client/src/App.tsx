import { useCallback, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { AdminLayout } from './admin/components/layout/AdminLayout';
import { AdminAgendaPage } from './admin/pages/AdminAgendaPage';
import { AdminAppointmentDetailsPage } from './admin/pages/AdminAppointmentDetailsPage';
import { AdminAppointmentsPage } from './admin/pages/AdminAppointmentsPage';
import { AdminBlockedDatesPage } from './admin/pages/AdminBlockedDatesPage';
import { AdminBusinessHoursPage } from './admin/pages/AdminBusinessHoursPage';
import { AdminCustomersPage } from './admin/pages/AdminCustomersPage';
import { AdminDashboardPage } from './admin/pages/AdminDashboardPage';
import { AdminGalleryPage } from './admin/pages/AdminGalleryPage';
import { AdminLoginPage } from './admin/pages/AdminLoginPage';
import { AdminProfilePage } from './admin/pages/AdminProfilePage';
import { AdminServicesPage } from './admin/pages/AdminServicesPage';
import { ProtectedAdminRoute } from './admin/routes/ProtectedAdminRoute';
import { BookingSection } from './components/booking/BookingSection';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { About } from './components/home/About';
import { Gallery } from './components/home/Gallery';
import { Hero } from './components/home/Hero';
import { Services } from './components/home/Services';
import { WhatsAppIcon } from './components/common/WhatsAppIcon';
import { useServices } from './hooks/useServices';
import { useTheme } from './hooks/useTheme';
import type { Service } from './types/service';
import { buildWhatsAppUrl } from './utils/whatsapp';

function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { services, isLoading, error, reload } = useServices();
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const selectService = useCallback((service: Service) => {
    setSelectedService(service);
    window.setTimeout(() => document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, []);

  return (
    <>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main id="main">
        <Hero />
        <About />
        <Services
          services={services}
          selectedServiceId={selectedService?.id}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          onSelectService={selectService}
        />
        <Gallery />
        <BookingSection services={services} selectedService={selectedService} onSelectedServiceChange={setSelectedService} />
      </main>
      <a className="whatsapp-float" href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" aria-label="Abrir WhatsApp da Barbearia Elite">
        <WhatsAppIcon size={31} />
      </a>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLoginPage} />
      <ProtectedAdminRoute path="/admin">
        <AdminLayout>
          <Switch>
            <Route exact path="/admin" component={AdminDashboardPage} />
            <Route exact path="/admin/agenda" component={AdminAgendaPage} />
            <Route exact path="/admin/agendamentos" component={AdminAppointmentsPage} />
            <Route path="/admin/agendamentos/:id" component={AdminAppointmentDetailsPage} />
            <Route path="/admin/servicos" component={AdminServicesPage} />
            <Route path="/admin/horarios" component={AdminBusinessHoursPage} />
            <Route path="/admin/bloqueios" component={AdminBlockedDatesPage} />
            <Route path="/admin/galeria" component={AdminGalleryPage} />
            <Route path="/admin/clientes" component={AdminCustomersPage} />
            <Route path="/admin/perfil" component={AdminProfilePage} />
            <Redirect to="/admin" />
          </Switch>
        </AdminLayout>
      </ProtectedAdminRoute>
      <Route path="/" component={HomePage} />
    </Switch>
  );
}
