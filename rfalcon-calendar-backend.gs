/**
 * RFALCON — Backend de reservas (Google Apps Script)
 * ---------------------------------------------------
 * Qué hace:
 *  1. Recibe los datos del formulario de la landing (equipo, responsable,
 *     rol, celular, plan, fecha, hora, cancha).
 *  2. Revisa el Google Calendar de Rfalconsports@gmail.com para ver si ya hay
 *     un partido agendado en ese horario (con un margen de duración).
 *  3. Si está libre: crea el evento en el calendario y responde "ok".
 *  4. Si está ocupado: responde "conflict" con el detalle del choque,
 *     para que la página avise al cliente en vez de agendarlo doble.
 *
 * CÓMO DESPLEGARLO (una sola vez):
 *  1. Entra a https://script.google.com con la cuenta Rfalconsports@gmail.com.
 *  2. Crea un proyecto nuevo, pega todo este código reemplazando lo que
 *     venga por defecto.
 *  3. Arriba a la derecha: "Implementar" > "Nueva implementación".
 *  4. Tipo: "Aplicación web".
 *     - Ejecutar como: "Yo (Rfalconsports@gmail.com)"
 *     - Quién tiene acceso: "Cualquier usuario"
 *  5. Autoriza los permisos (te va a pedir acceso a tu Calendar).
 *  6. Copia la URL que te entrega Google (termina en /exec) y pégala en
 *     el archivo index.html, en la constante BOOKING_ENDPOINT (más abajo
 *     te digo exactamente dónde).
 *
 * Cada vez que edites este script y quieras que los cambios se reflejen,
 * debes crear una "Nueva implementación" otra vez (o gestionar versiones).
 */

// ==== CONFIGURACIÓN ====
var CALENDAR_ID = 'Rfalconsports@gmail.com'; // Calendario donde se agenda
var DURATION_MINUTES = 110;             // Duración estimada de cada partido/bloqueo

function doPost(e) {
  var result;
  try {
    var data = JSON.parse(e.postData.contents);
    result = handleBooking(data);
  } catch (err) {
    result = { status: 'error', message: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Permite probar el endpoint abriendo la URL en el navegador (GET)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'RFALCON booking endpoint activo' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleBooking(data) {
  var required = ['team', 'name', 'role', 'phone', 'plan', 'date', 'time', 'location'];
  for (var i = 0; i < required.length; i++) {
    if (!data[required[i]]) {
      return { status: 'error', message: 'Falta el campo: ' + required[i] };
    }
  }

  var start = new Date(data.date + 'T' + data.time + ':00');
  if (isNaN(start.getTime())) {
    return { status: 'error', message: 'Fecha u hora inválida' };
  }
  var end = new Date(start.getTime() + DURATION_MINUTES * 60000);

  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    return { status: 'error', message: 'No se pudo acceder al calendario. Verifica CALENDAR_ID y permisos.' };
  }

  // Revisa choques de horario
  var existingEvents = calendar.getEvents(start, end);
  if (existingEvents.length > 0) {
    var conflicts = existingEvents.map(function (ev) {
      return {
        title: ev.getTitle(),
        start: ev.getStartTime(),
        end: ev.getEndTime()
      };
    });
    return {
      status: 'conflict',
      message: 'Ya hay un partido agendado en ese horario.',
      conflicts: conflicts
    };
  }

  // Sin choques: crea el evento
  var title = 'Partido — ' + data.team + ' (' + data.plan + ')';
  var description =
    'Reserva RFALCON\n' +
    'Equipo/Club: ' + data.team + '\n' +
    'Reserva: ' + data.name + ' (' + data.role + ')\n' +
    'Celular: ' + data.phone + '\n' +
    'Plan de interés: ' + data.plan + '\n' +
    'Cancha: ' + data.location;

  var event = calendar.createEvent(title, start, end, {
    description: description,
    location: data.location
  });

  return {
    status: 'ok',
    message: 'Reserva registrada en el calendario.',
    eventId: event.getId(),
    start: start,
    end: end
  };
}
