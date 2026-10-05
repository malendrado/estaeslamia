import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page">
      <h1>Política de Privacidad</h1>
      <p class="updated">Última actualización: {{ lastUpdated }}</p>

      <section>
        <h2>1. Qué datos recopilamos</h2>
        <p><strong>Si envías una solicitud de servicio (Cliente):</strong></p>
        <ul>
          <li>Nombre, email y teléfono de contacto</li>
          <li>Descripción de lo que necesitas, comuna, dirección (opcional), fecha preferida y presupuesto (opcionales)</li>
        </ul>
        <p><strong>Si registras una empresa (Provider):</strong></p>
        <ul>
          <li>Nombre de la empresa, nombre de contacto, email, teléfono, descripción del negocio</li>
          <li>Servicios ofrecidos y comunas de cobertura</li>
          <li>Contraseña de acceso (almacenada siempre cifrada — nunca en texto plano)</li>
        </ul>
        <p>No recopilamos datos de pago en esta etapa del producto, porque la plataforma no procesa pagos todavía.</p>
      </section>

      <section>
        <h2>2. Para qué usamos tus datos</h2>
        <ul>
          <li><strong>Hacer el match:</strong> cuando envías una solicitud, buscamos empresas activas que ofrezcan ese servicio en tu comuna.</li>
          <li><strong>Compartir tu contacto:</strong> si hay una coincidencia, tus datos de contacto se entregan a esa(s) empresa(s) específica(s) — y solo a ellas, nunca a terceros ajenos a tu solicitud.</li>
          <li><strong>Gestionar tu cuenta:</strong> si te registras, usamos tu email para autenticarte y enviarte información relacionada con tu cuenta.</li>
        </ul>
        <p>
          Tus datos de contacto <strong>nunca se comparten sin tu consentimiento explícito</strong> — lo aceptas
          activamente al enviar una solicitud, marcando la casilla correspondiente en el formulario.
        </p>
      </section>

      <section>
        <h2>3. Dónde se almacenan tus datos</h2>
        <p>
          Nuestra base de datos está alojada en un proveedor de infraestructura en la nube (actualmente
          Supabase/Neon, sobre PostgreSQL). Esto puede implicar que tus datos se procesen en servidores fuera de
          Chile. Tomamos medidas razonables de seguridad (contraseñas cifradas, conexiones con SSL, acceso
          restringido por roles) para proteger esa información.
        </p>
      </section>

      <section>
        <h2>4. Con quién compartimos datos</h2>
        <ul>
          <li>Con las empresas que coincidan con tu solicitud de servicio (ver sección 2).</li>
          <li>Con nuestro proveedor de base de datos, únicamente como parte del almacenamiento técnico — no tiene acceso a usar tus datos por su cuenta.</li>
          <li>No vendemos ni arrendamos tus datos a terceros para publicidad u otros fines.</li>
        </ul>
      </section>

      <section>
        <h2>5. Tus derechos (Ley 19.628 sobre Protección de Datos Personales)</h2>
        <p>Como titular de tus datos, en Chile tienes derecho a:</p>
        <ul>
          <li><strong>Acceso:</strong> saber qué datos tuyos tenemos.</li>
          <li><strong>Rectificación:</strong> corregir datos incorrectos o desactualizados.</li>
          <li><strong>Cancelación:</strong> pedir que eliminemos tus datos cuando ya no sean necesarios para el propósito con el que los entregaste.</li>
          <li><strong>Oposición:</strong> oponerte a un uso específico de tus datos.</li>
        </ul>
        <p>Para ejercer cualquiera de estos derechos, contáctanos a través de los datos publicados en el sitio.</p>
      </section>

      <section>
        <h2>6. Cuentas "silenciosas"</h2>
        <p>
          Si envías una solicitud sin registrarte, creamos internamente un registro mínimo asociado a tu email
          (sin contraseña, inactivo) solo para vincular tu solicitud. Si luego te registras con ese mismo email,
          esa cuenta se activa automáticamente y podrás ver el historial de lo que habías solicitado.
        </p>
      </section>

      <section>
        <h2>7. Cookies y almacenamiento local</h2>
        <p>
          Usamos almacenamiento local del navegador (localStorage) únicamente para mantener tu sesión iniciada.
          Actualmente no usamos cookies de rastreo ni herramientas de analítica de terceros. Si eso cambia en el
          futuro, actualizaremos esta política.
        </p>
      </section>

      <section>
        <h2>8. Cambios a esta política</h2>
        <p>
          Podemos actualizar esta Política de Privacidad a medida que la plataforma evolucione (por ejemplo, al
          incorporar pagos o notificaciones). Publicaremos la fecha de la última actualización en esta misma página.
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
export class PrivacyComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  readonly lastUpdated = 'Octubre 2026';

  ngOnInit(): void {
    this.seoService.set({
      title: 'Política de Privacidad',
      description: 'Política de privacidad de EstaEsLaMía.cl',
      path: '/privacidad',
      noindex: true,
    });
  }
}
