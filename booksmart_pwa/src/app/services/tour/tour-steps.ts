import { TourStep } from './tour';

/**
 * Tour steps for the demo walkthrough.
 * Each step targets a specific UI element and explains its purpose.
 */
export const DEMO_TOUR_STEPS: TourStep[] = [
  // ─── 1. Welcome / Home ──────────────────────────────────
  {
    selector: '.home-header h1',
    title: '¡Bienvenido a Booksmart! 🎉',
    description:
      'Este es tu panel principal. Aquí verás todos los negocios que administras y podrás crear nuevos.',
    position: 'bottom',
    route: '/app/home',
    delay: 500,
  },
  {
    selector: '.establishment-card',
    title: 'Tu negocio de ejemplo',
    description:
      'Hemos creado un negocio de demo con datos reales para que explores todas las funcionalidades. Haz clic para entrar a gestionarlo.',
    position: 'bottom',
  },

  // ─── 2. Negocio - Sidebar ────────────────────────────────
  {
    selector: '.negocio-sidebar',
    title: 'Panel de navegación',
    description:
      'Desde aquí puedes acceder a todas las secciones de tu negocio: calendario, mensajes, horarios, servicios, reseñas y configuración.',
    position: 'right',
    route: '/app/negocio',
    delay: 600,
  },

  // ─── 3. Calendario ──────────────────────────────────────
  {
    selector: '.calendar-container',
    title: 'Calendario de citas 📅',
    description:
      'Visualiza todas las citas de tu negocio en un calendario interactivo. Los días con puntos tienen citas programadas.',
    position: 'bottom',
    clickBefore: '.sidebar-btn:nth-child(1)',
    delay: 400,
  },
  {
    selector: '.worker-selector-card',
    title: 'Filtro por profesional',
    description:
      'Si tienes varios trabajadores, puedes filtrar las citas por profesional para ver solo las de cada uno.',
    position: 'bottom',
  },

  // ─── 4. Mensajes ────────────────────────────────────────
  {
    selector: '.messages-layout',
    title: 'Centro de mensajes 💬',
    description:
      'Aquí podrás intercambiar mensajes con tus clientes respecto a cada cita. Filtra por período y estado.',
    position: 'bottom',
    clickBefore: '.sidebar-btn:nth-child(2)',
    delay: 400,
  },

  // ─── 5. Horarios ───────────────────────────────────────
  {
    selector: '.horarios-list',
    title: 'Horarios de atención ⏰',
    description:
      'Configura los días y horas en que tu negocio atiende. Puedes abrir o cerrar cada día de forma individual.',
    position: 'right',
    clickBefore: '.sidebar-btn:nth-child(3)',
    delay: 400,
  },
  {
    selector: '.closures-card',
    title: 'Cierres especiales',
    description:
      'Registra feriados, vacaciones o cualquier día que no atenderás. Esto bloquea automáticamente las citas para esa fecha.',
    position: 'bottom',
  },

  // ─── 6. Servicios ──────────────────────────────────────
  {
    selector: '.section-head',
    title: 'Catálogo de servicios 💇',
    description:
      'Crea y administra los servicios que ofrece tu negocio. Define nombre, precio, duración y descripción para cada uno.',
    position: 'right',
    clickBefore: '.sidebar-btn:nth-child(4)',
    delay: 400,
  },
  {
    selector: '.service-list',
    title: 'Tus servicios activos',
    description:
      'Aquí aparecen todos tus servicios registrados. Puedes editarlos o eliminarlos en cualquier momento.',
    position: 'left',
  },

  // ─── 7. Reseñas ─────────────────────────────────────────
  {
    selector: '.tab-content',
    title: 'Reseñas de clientes ⭐',
    description:
      'Mira las calificaciones y comentarios que dejan tus clientes. Esto te ayuda a mejorar tu servicio.',
    position: 'left',
    clickBefore: '.sidebar-btn:nth-child(5)',
    delay: 400,
  },

  // ─── 8. Perfil del negocio ────────────────────────────────
  {
    selector: '.form-card',
    title: 'Perfil del negocio 🏪',
    description:
      'Edita los datos de tu establecimiento: nombre, dirección, teléfono y ubicación en el mapa.',
    position: 'right',
    clickBefore: '.sidebar-section:nth-child(2) .sidebar-btn:nth-child(1)',
    delay: 400,
  },

  // ─── 9. Equipo ─────────────────────────────────────────
  {
    selector: '.section-head',
    title: 'Gestión de equipo 👥',
    description:
      'Agrega y administra a los profesionales que trabajan en tu negocio. Asígnales servicios específicos.',
    position: 'bottom',
    clickBefore: '.sidebar-section:nth-child(2) .sidebar-btn:nth-child(2)',
    delay: 400,
  },

  // ─── 10. Navbar ──────────────────────────────────────────
  {
    selector: '.logout-btn',
    title: 'Navegación principal',
    description:
      'Desde la barra lateral puedes acceder rápidamente a: tus negocios, notificaciones, suscripciones, tema oscuro y cerrar sesión.',
    position: 'left',
  },

  // ─── 11. Final ─────────────────────────────────────────
  {
    selector: '.nav-wrapper',
    title: '¡Listo para empezar! 🚀',
    description:
      'Ya conoces todas las herramientas de Booksmart. Esta es una cuenta de demostración — los datos se reinician automáticamente. ¡Crea tu cuenta real para empezar!',
    position: 'bottom',
  },
];
