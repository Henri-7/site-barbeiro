import { ArrowUp, Scissors } from 'lucide-react';
import { WhatsAppOutlineIcon } from '../common/WhatsAppIcon';
import { navigationItems } from '../../data/navigation';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="brand footer-brand">
            <Scissors size={22} />
            <span>Barbearia Elite</span>
          </div>
          <p>A experiência de barbearia que você merece em Cássia, MG.</p>
        </div>
        <div>
          <h3>Links</h3>
          {navigationItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <div>
          <h3>Contato</h3>
          <p>Telefone: (35) 98475-2062</p>
          <p>Endereço a definir</p>
          <p>Instagram a configurar</p>
          <a className="footer-whatsapp" href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
            <WhatsAppOutlineIcon size={18} />
            Chamar no WhatsApp
          </a>
        </div>
        <div>
          <h3>Horários</h3>
          <p>Segunda a sábado</p>
          <p>08:00 às 12:00 e 14:00 às 19:00</p>
        </div>
      </div>
      <div className="footer-bottom">
        <a className="icon-button" href="#home" aria-label="Voltar ao topo">
          <ArrowUp size={18} />
        </a>
      </div>
    </footer>
  );
}
