/**
 * Embudo de conversión del MVP (ver Fase 0: "validar que una persona puede
 * solicitar un servicio y que una empresa pagaría por ese lead"). Se agregan
 * eventos nuevos solo si realmente ayudan a medir eso — no un catálogo abierto.
 */
export enum AnalyticsEventType {
  PAGE_VIEW_HOME = 'PAGE_VIEW_HOME',
  WIZARD_STARTED = 'WIZARD_STARTED',
  SERVICE_REQUEST_CREATED = 'SERVICE_REQUEST_CREATED',
  CUSTOMER_REGISTERED = 'CUSTOMER_REGISTERED',
  PROVIDER_REGISTERED = 'PROVIDER_REGISTERED',
}
