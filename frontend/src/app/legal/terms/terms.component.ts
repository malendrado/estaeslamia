import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page">
      <h1>Términos y Condiciones</h1>
      <p class="updated">Última actualización: {{ lastUpdated }}</p>

      <section>
        <h2>1. Qué es EstaEsLaMía.cl</h2>
        <p>
          EstaEsLaMía.cl es una plataforma que conecta a personas que necesitan contratar un servicio
          ("Clientes") con empresas y profesionales independientes que ofrecen esos servicios ("Empresas" o
          "Providers") en una comuna determinada. Nuestro rol es facilitar ese encuentro — no prestamos los
          servicios solicitados, no somos parte del acuerdo comercial que llegues a tener con una Empresa, y no
          garantizamos la calidad, legalidad o resultado del trabajo realizado.
        </p>
      </section>

      <section>
        <h2>2. Uso de la plataforma por Clientes</h2>
        <p>Al enviar una solicitud de servicio, declaras que:</p>
        <ul>
          <li>La información que entregas (descripción, datos de contacto) es real y corresponde a una necesidad genuina.</li>
          <li>Autorizas que tus datos de contacto se compartan con las Empresas que coincidan con tu solicitud (mismo servicio y comuna), según el consentimiento que aceptas al enviarla.</li>
          <li>Entiendes que el contacto final con una Empresa, la negociación, el precio y la ejecución del servicio quedan completamente fuera de nuestra plataforma — nosotros solo hacemos la conexión inicial.</li>
        </ul>
        <p>Publicar una solicitud como Cliente no tiene costo.</p>
      </section>

      <section>
        <h2>3. Uso de la plataforma por Empresas</h2>
        <p>Al registrar tu empresa, declaras que:</p>
        <ul>
          <li>Los datos de tu negocio (nombre, descripción, servicios, comunas de cobertura) son reales y actuales.</li>
          <li>Tu cuenta queda en estado <strong>pendiente</strong> hasta que un administrador la revise y apruebe — podemos rechazar o suspender cuentas que entreguen información falsa, no respondan a leads de forma razonable, o incumplan estos términos.</li>
          <li>Los leads que recibes son oportunidades de contacto, no garantías de venta. No cobramos por lead en esta etapa del producto, pero nos reservamos el derecho de introducir modelos de pago (por lead, por suscripción, u otros) en el futuro, con aviso previo.</li>
        </ul>
      </section>

      <section>
        <h2>4. Qué NO hacemos</h2>
        <ul>
          <li>No verificamos antecedentes legales, tributarios o de seguros de las Empresas más allá de la revisión administrativa básica al aprobar su cuenta.</li>
          <li>No mediamos en disputas entre Clientes y Empresas, ni procesamos pagos entre ambas partes.</li>
          <li>No nos hacemos responsables por daños, pérdidas o perjuicios derivados de un servicio contratado a través de un contacto generado en la plataforma.</li>
        </ul>
      </section>

      <section>
        <h2>5. Cuentas y acceso</h2>
        <p>
          Eres responsable de mantener la confidencialidad de tu contraseña. Podemos suspender cualquier cuenta
          que use la plataforma de forma fraudulenta, para spam, o que viole estos términos.
        </p>
      </section>

      <section>
        <h2>6. Cambios a estos términos</h2>
        <p>
          Podemos actualizar estos Términos y Condiciones a medida que la plataforma evolucione. Te avisaremos
          de cambios relevantes, y el uso continuado de la plataforma después de un cambio implica tu aceptación.
        </p>
      </section>

      <section>
        <h2>7. Contacto</h2>
        <p>
          Para consultas sobre estos términos, puedes contactarnos a través de los datos publicados en el sitio.
        </p>
      </section>

      <p class="back"><a routerLink="/">← Volver al inicio</a></p>
    </div>
  `,
  styles: [
    `
      .legal-page {
        max-width: 720px;
        margin: 0 auto;
        padding: 3rem 1.5rem 5rem;
      }
      h1 {
        margin-bottom: 0.25rem;
      }
      .updated {
        color: #757575;
        font-size: 0.85rem;
        margin-bottom: 2rem;
      }
      section {
        margin-bottom: 2rem;
      }
      h2 {
        font-size: 1.15rem;
        margin-bottom: 0.5rem;
      }
      p,
      li {
        color: #333;
        line-height: 1.6;
        font-size: 0.95rem;
      }
      ul {
        padding-left: 1.25rem;
      }
      li {
        margin-bottom: 0.4rem;
      }
      .back {
        margin-top: 2.5rem;
      }
      .back a {
        color: var(--eslm-primary);
        text-decoration: none;
        font-weight: 600;
      }
    `,
  ],
})
export class TermsComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  readonly lastUpdated = 'Octubre 2026';

  ngOnInit(): void {
    this.seoService.set({
      title: 'Términos y Condiciones',
      description: 'Términos y condiciones de uso de EstaEsLaMía.cl',
      path: '/terminos',
      noindex: true,
    });
  }
}
