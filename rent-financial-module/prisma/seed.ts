import { PrismaService } from '../src/core/database/prisma.service.js';
import {
  TYPE_PROPERTY_UUIDS,
  TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS,
  TYPE_PROPERTY_ACTOR_ROLE_UUIDS,
  TYPE_TENANT_ACTOR_ROLES_UUIDS,
  TYPE_LANDORD_ACTOR_ROLES_UUIDS,
  POLICIES_STATEMENTS,
} from '../src/types/global-types.js';

const prisma = new PrismaService();

async function main() {
  await prisma.typeProperty.createMany({
    data: [
      {
        id: TYPE_PROPERTY_UUIDS.RESIDENCIAL,
        name: 'RESIDENCIAL',
        description:
          'Propiedades destinadas principalmente para uso habitacional, como casas, apartamentos o condominios.',
      },
      {
        id: TYPE_PROPERTY_UUIDS.COMERCIAL,
        name: 'COMERCIAL',
        description:
          'Propiedades destinadas al desarrollo de actividades comerciales, como locales, oficinas o centros comerciales.',
      },
      {
        id: TYPE_PROPERTY_UUIDS.INDUSTRIAL,
        name: 'INDUSTRIAL',
        description:
          'Propiedades destinadas a procesos industriales, fabricación, almacenamiento o logística.',
      },
      {
        id: TYPE_PROPERTY_UUIDS.TERRENO,
        name: 'TERRENO',
        description:
          'Terrenos o lotes sin construcciones, aptos para desarrollo, inversión o conservación.',
      },
      {
        id: TYPE_PROPERTY_UUIDS.URBANO,
        name: 'URBANO',
        description:
          'Propiedades ubicadas dentro del perímetro urbano con acceso a servicios públicos e infraestructura.',
      },
      {
        id: TYPE_PROPERTY_UUIDS.AGRARIO,
        name: 'AGRARIO',
        description:
          'Propiedades destinadas a actividades agrícolas, ganaderas o agropecuarias.',
      },
      {
        id: TYPE_PROPERTY_UUIDS.MIXTO,
        name: 'MIXTO',
        description:
          'Propiedades que permiten una combinación de usos, como residencial y comercial.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.propertyOccupationType.createMany({
    data: [
      {
        id: TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS.OCUPADO,
        name: 'OCUPADO',
        description:
          'La propiedad se encuentra ocupada por uno o más residentes, propietarios o arrendatarios.',
      },
      {
        id: TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS.DESOCUPADO,
        name: 'DESOCUPADO',
        description:
          'La propiedad está desocupada y disponible para venta, arriendo o uso.',
      },
      {
        id: TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS.EN_PROCESO,
        name: 'EN_PROCESO',
        description:
          'La propiedad se encuentra en proceso de ocupación, desocupación, entrega o trámite administrativo.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.propertyActorRole.createMany({
    data: [
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.ADMINISTRADOR,
        name: 'ADMINISTRADOR',
        description:
          'Persona encargada de administrar el inmueble por cuenta del propietario.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.AGENTE_INMOBILIARIO,
        name: 'AGENTE_INMOBILIARIO',
        description:
          'Profesional encargado de gestionar operaciones inmobiliarias en representación del propietario o arrendador.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.GESTOR_INMOBILIARIO,
        name: 'GESTOR_INMOBILIARIO',
        description:
          'Persona encargada de gestionar aspectos administrativos, contractuales y operativos del inmueble.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.REPRESENTANTE_LEGAL,
        name: 'REPRESENTANTE_LEGAL',
        description:
          'Persona autorizada legalmente para actuar en representación del propietario o titular del inmueble.',
      },

      {
        id: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
        name: 'ARRENDADO',
        description:
          'Arrendatario que ocupa el inmueble mediante un contrato de arrendamiento.',
      },
      {
        id: TYPE_TENANT_ACTOR_ROLES_UUIDS.COARRENDATARIO,
        name: 'COARRENDATARIO',
        description:
          'Persona que comparte con el arrendatario la condición de parte del contrato de arrendamiento.',
      },
      {
        id: TYPE_TENANT_ACTOR_ROLES_UUIDS.FIADOR,
        name: 'FIADOR',
        description:
          'Persona que garantiza el cumplimiento de las obligaciones del arrendatario frente al propietario.',
      },
      {
        id: TYPE_TENANT_ACTOR_ROLES_UUIDS.CODEUDOR,
        name: 'CODEUDOR',
        description:
          'Persona que asume conjuntamente con el arrendatario las obligaciones derivadas del contrato.',
      },
      {
        id: TYPE_TENANT_ACTOR_ROLES_UUIDS.AVALISTA,
        name: 'AVALISTA',
        description:
          'Persona que respalda las obligaciones económicas o contractuales asumidas por otro actor.',
      },
      {
        id: TYPE_TENANT_ACTOR_ROLES_UUIDS.PRELIMINARY_TENANT,
        name: 'ARRENDADO_PRELIMINAR',
        description:
          'Persona que aun no ha firmado contrato de arrendamiento y esta a la espera de firmar o por su parte rechazar el inmueble',
      },
      {
        id: TYPE_LANDORD_ACTOR_ROLES_UUIDS.PROPIETARIO,
        name: 'PROPIETARIO',
        description: 'Propietario o arrendador del inmueble.',
      },
      {
        id: TYPE_LANDORD_ACTOR_ROLES_UUIDS.COPROPIETARIO,
        name: 'COPROPIETARIO',
        description:
          'Persona que posee conjuntamente con otros titulares derechos de propiedad sobre el inmueble.',
      },
      {
        id: TYPE_LANDORD_ACTOR_ROLES_UUIDS.USUFRUCTUARIO,
        name: 'USUFRUCTUARIO',
        description:
          'Persona que tiene derecho a usar y disfrutar del inmueble sin ser necesariamente su propietario.',
      },

      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.MIEMBRO,
        name: 'MIEMBRO',
        description:
          'Miembro sin privilegios administrativos que forma parte de la propiedad.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.RESIDENTE,
        name: 'RESIDENTE',
        description: 'Persona que reside habitualmente en el inmueble.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.FAMILIAR,
        name: 'FAMILIAR',
        description:
          'Familiar de un propietario, arrendatario o residente que forma parte de la convivencia del inmueble.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.OCUPANTE_AUTORIZADO,
        name: 'OCUPANTE_AUTORIZADO',
        description:
          'Persona autorizada para ocupar o permanecer en el inmueble sin ser necesariamente parte del contrato de arrendamiento.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.INVITADO,
        name: 'INVITADO',
        description:
          'Persona autorizada temporalmente por un miembro de la propiedad para ingresar o permanecer en el inmueble.',
      },

      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.SOPORTE_OPERATIVO,
        name: 'SOPORTE_OPERATIVO',
        description:
          'Encargado de inspecciones, entregas, mantenimientos y apoyo operativo.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.PERSONAL_MANTENIMIENTO,
        name: 'PERSONAL_MANTENIMIENTO',
        description:
          'Persona encargada de realizar labores generales de mantenimiento y conservación del inmueble.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.TECNICO,
        name: 'TECNICO',
        description:
          'Profesional técnico encargado de realizar diagnósticos, reparaciones o trabajos especializados en el inmueble.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.ELECTRICISTA,
        name: 'ELECTRICISTA',
        description:
          'Profesional encargado de realizar instalaciones, inspecciones y reparaciones relacionadas con el sistema eléctrico.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.PLOMERO,
        name: 'PLOMERO',
        description:
          'Profesional encargado de realizar instalaciones, inspecciones y reparaciones de sistemas hidráulicos y sanitarios.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.PERSONAL_LIMPIEZA,
        name: 'PERSONAL_LIMPIEZA',
        description:
          'Persona encargada de realizar labores de limpieza y mantenimiento de las condiciones de higiene del inmueble.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.JARDINERO,
        name: 'JARDINERO',
        description:
          'Persona encargada del cuidado y mantenimiento de jardines, plantas y zonas verdes del inmueble.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.SEGURIDAD,
        name: 'SEGURIDAD',
        description:
          'Persona encargada de labores de vigilancia y seguridad relacionadas con el inmueble.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.CONSERJE,
        name: 'CONSERJE',
        description:
          'Persona encargada de labores de atención, vigilancia y apoyo general dentro del inmueble.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.policyStatement.createMany({
    data: [
      // politicas para informacion del inmueble
      {
        id: POLICIES_STATEMENTS.VER_INMUEBLE,
        policyName: 'VER_INMUEBLE',
        description:
          'Permite ver la informacion completa del inmueble (Documentos legales no pertenecen a esta politica)',
      },
      {
        id: POLICIES_STATEMENTS.EDITAR_INMUEBLE,
        policyName: 'EDITAR_INMUEBLE',
        description:
          'Permite editar la informacion general y las caracteristicas del inmueble',
      },
      {
        id: POLICIES_STATEMENTS.ELIMINAR_INMUEBLE,
        policyName: 'ELIMINAR_INMUEBLE',
        description: 'Permite eliminar el inmueble del sistema',
      },
      {
        id: POLICIES_STATEMENTS.VER_DOCUMENTOS_INMUEBLE,
        policyName: 'VER_DOCUMENTOS_INMUEBLE',
        description:
          'Permite consultar y visualizar los documentos asociados al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.SUBIR_DOCUMENTOS_INMUEBLE,
        policyName: 'SUBIR_DOCUMENTOS_INMUEBLE',
        description: 'Permite subir documentos asociados al inmueble',
      },

      // politicas de contratos
      {
        id: POLICIES_STATEMENTS.VER_CONTRATOS,
        policyName: 'VER_CONTRATOS',
        description:
          'Permite consultar y visualizar los contratos asociados al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.REGISTRAR_CONTRATOS,
        policyName: 'REGISTRAR_CONTRATOS',
        description: 'Permite registrar nuevos contratos asociados al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.EDITAR_CONTRATOS,
        policyName: 'EDITAR_CONTRATOS',
        description:
          'Permite editar la informacion de los contratos registrados',
      },
      {
        id: POLICIES_STATEMENTS.ELIMINAR_CONTRATOS,
        policyName: 'ELIMINAR_CONTRATOS',
        description: 'Permite eliminar contratos registrados',
      },
      {
        id: POLICIES_STATEMENTS.RENOVAR_CONTRATOS,
        policyName: 'RENOVAR_CONTRATOS',
        description: 'Permite renovar contratos existentes',
      },
      {
        id: POLICIES_STATEMENTS.FINALIZAR_CONTRATOS,
        policyName: 'FINALIZAR_CONTRATOS',
        description: 'Permite finalizar contratos activos',
      },
      {
        id: POLICIES_STATEMENTS.SUSPENDER_CONTRATOS,
        policyName: 'SUSPENDER_CONTRATOS',
        description: 'Permite suspender temporalmente contratos activos',
      },
      {
        id: POLICIES_STATEMENTS.DESCARGAR_CONTRATOS,
        policyName: 'DESCARGAR_CONTRATOS',
        description:
          'Permite descargar los documentos o archivos correspondientes a los contratos',
      },
      {
        id: POLICIES_STATEMENTS.VER_DOCUMENTOS_CONTRATO,
        policyName: 'VER_DOCUMENTOS_CONTRATO',
        description:
          'Permite consultar y visualizar los documentos asociados a un contrato',
      },
      {
        id: POLICIES_STATEMENTS.SUBIR_DOCUMENTOS_CONTRATO,
        policyName: 'SUBIR_DOCUMENTOS_CONTRATO',
        description: 'Permite subir documentos asociados a un contrato',
      },
      {
        id: POLICIES_STATEMENTS.ELIMINAR_DOCUMENTOS_CONTRATO,
        policyName: 'ELIMINAR_DOCUMENTOS_CONTRATO',
        description: 'Permite eliminar documentos asociados a un contrato',
      },
      {
        id: POLICIES_STATEMENTS.VER_HISTORIAL_CONTRATO,
        policyName: 'VER_HISTORIAL_CONTRATO',
        description:
          'Permite consultar el historial de cambios y eventos de un contrato',
      },

      // politicas de servicios publicos
      {
        id: POLICIES_STATEMENTS.CONSULTAR_SERVICIOS_PUBLICOS,
        policyName: 'CONSULTAR_SERVICIOS_PUBLICOS',
        description:
          'Permite consultar los servicios publicos asociados al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.REGISTRAR_SERVICIO_PUBLICO,
        policyName: 'REGISTRAR_SERVICIO_PUBLICO',
        description:
          'Permite registrar servicios publicos asociados al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.EDITAR_SERVICIO_PUBLICO,
        policyName: 'EDITAR_SERVICIO_PUBLICO',
        description:
          'Permite editar la informacion de los servicios publicos registrados',
      },
      {
        id: POLICIES_STATEMENTS.ELIMINAR_SERVICIO_PUBLICO,
        policyName: 'ELIMINAR_SERVICIO_PUBLICO',
        description:
          'Permite eliminar servicios publicos asociados al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.CONSULTAR_FACTURAS_SERVICIOS_PUBLICOS,
        policyName: 'CONSULTAR_FACTURAS_SERVICIOS_PUBLICOS',
        description: 'Permite consultar las facturas de los servicios publicos',
      },
      {
        id: POLICIES_STATEMENTS.REGISTRAR_FACTURA_SERVICIO_PUBLICO,
        policyName: 'REGISTRAR_FACTURA_SERVICIO_PUBLICO',
        description:
          'Permite registrar facturas correspondientes a los servicios publicos',
      },
      {
        id: POLICIES_STATEMENTS.EDITAR_FACTURA_SERVICIO_PUBLICO,
        policyName: 'EDITAR_FACTURA_SERVICIO_PUBLICO',
        description:
          'Permite editar facturas correspondientes a los servicios publicos',
      },
      {
        id: POLICIES_STATEMENTS.ELIMINAR_FACTURA_SERVICIO_PUBLICO,
        policyName: 'ELIMINAR_FACTURA_SERVICIO_PUBLICO',
        description:
          'Permite eliminar facturas correspondientes a los servicios publicos',
      },
      {
        id: POLICIES_STATEMENTS.CONSULTAR_CONSUMOS_SERVICIOS_PUBLICOS,
        policyName: 'CONSULTAR_CONSUMOS_SERVICIOS_PUBLICOS',
        description:
          'Permite consultar los consumos registrados de los servicios publicos',
      },
      {
        id: POLICIES_STATEMENTS.REGISTRAR_LECTURA_SERVICIO_PUBLICO,
        policyName: 'REGISTRAR_LECTURA_SERVICIO_PUBLICO',
        description:
          'Permite registrar lecturas de los medidores de servicios publicos',
      },
      {
        id: POLICIES_STATEMENTS.EDITAR_LECTURA_SERVICIO_PUBLICO,
        policyName: 'EDITAR_LECTURA_SERVICIO_PUBLICO',
        description:
          'Permite editar lecturas registradas de los servicios publicos',
      },
      {
        id: POLICIES_STATEMENTS.CONSULTAR_PAGOS_SERVICIOS_PUBLICOS,
        policyName: 'CONSULTAR_PAGOS_SERVICIOS_PUBLICOS',
        description:
          'Permite consultar los pagos realizados correspondientes a los servicios publicos',
      },
      {
        id: POLICIES_STATEMENTS.REGISTRAR_PAGO_SERVICIO_PUBLICO,
        policyName: 'REGISTRAR_PAGO_SERVICIO_PUBLICO',
        description:
          'Permite registrar pagos correspondientes a los servicios publicos',
      },
      {
        id: POLICIES_STATEMENTS.EDITAR_PAGO_SERVICIO_PUBLICO,
        policyName: 'EDITAR_PAGO_SERVICIO_PUBLICO',
        description:
          'Permite editar los pagos registrados de los servicios publicos',
      },
      {
        id: POLICIES_STATEMENTS.DESCARGAR_FACTURAS_SERVICIOS_PUBLICOS,
        policyName: 'DESCARGAR_FACTURAS_SERVICIOS_PUBLICOS',
        description:
          'Permite descargar las facturas correspondientes a los servicios publicos',
      },
      {
        id: POLICIES_STATEMENTS.VER_HISTORIAL_SERVICIOS_PUBLICOS,
        policyName: 'VER_HISTORIAL_SERVICIOS_PUBLICOS',
        description:
          'Permite consultar el historial de cambios y eventos relacionados con los servicios publicos',
      },

      // politicas de informacion legales
      {
        id: POLICIES_STATEMENTS.CONSULTAR_INFORMACION_LEGAL,
        policyName: 'CONSULTAR_INFORMACION_LEGAL',
        description:
          'Permite consultar la informacion legal asociada al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.REGISTRAR_INFORMACION_LEGAL,
        policyName: 'REGISTRAR_INFORMACION_LEGAL',
        description: 'Permite registrar informacion legal asociada al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.EDITAR_INFORMACION_LEGAL,
        policyName: 'EDITAR_INFORMACION_LEGAL',
        description: 'Permite editar la informacion legal asociada al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.ELIMINAR_INFORMACION_LEGAL,
        policyName: 'ELIMINAR_INFORMACION_LEGAL',
        description: 'Permite eliminar informacion legal asociada al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.CONSULTAR_DOCUMENTOS_LEGALES,
        policyName: 'CONSULTAR_DOCUMENTOS_LEGALES',
        description:
          'Permite consultar y visualizar los documentos legales asociados al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.SUBIR_DOCUMENTOS_LEGALES,
        policyName: 'SUBIR_DOCUMENTOS_LEGALES',
        description: 'Permite subir documentos legales asociados al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.DESCARGAR_DOCUMENTOS_LEGALES,
        policyName: 'DESCARGAR_DOCUMENTOS_LEGALES',
        description:
          'Permite descargar documentos legales asociados al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.ELIMINAR_DOCUMENTOS_LEGALES,
        policyName: 'ELIMINAR_DOCUMENTOS_LEGALES',
        description:
          'Permite eliminar documentos legales asociados al inmueble',
      },
      {
        id: POLICIES_STATEMENTS.CONSULTAR_HISTORIAL_LEGAL,
        policyName: 'CONSULTAR_HISTORIAL_LEGAL',
        description:
          'Permite consultar el historial de cambios y eventos de la informacion legal del inmueble',
      },

      // politicas de invitacion de miembros
      {
        id: POLICIES_STATEMENTS.CONSULTAR_INVITACIONES_MIEMBROS,
        policyName: 'CONSULTAR_INVITACIONES_MIEMBROS',
        description:
          'Permite consultar las invitaciones de miembros realizadas para el inmueble',
      },
      {
        id: POLICIES_STATEMENTS.ENVIAR_INVITACION_MIEMBRO,
        policyName: 'ENVIAR_INVITACION_MIEMBRO',
        description:
          'Permite enviar invitaciones a nuevos miembros para formar parte del inmueble',
      },
      {
        id: POLICIES_STATEMENTS.REENVIAR_INVITACION_MIEMBRO,
        policyName: 'REENVIAR_INVITACION_MIEMBRO',
        description: 'Permite reenviar una invitacion existente a un miembro',
      },
      {
        id: POLICIES_STATEMENTS.CANCELAR_INVITACION_MIEMBRO,
        policyName: 'CANCELAR_INVITACION_MIEMBRO',
        description:
          'Permite cancelar invitaciones de miembros que se encuentren pendientes',
      },
    ],
    skipDuplicates: true,
  });

  //definimos las politicas para cada rol
  await prisma.propertyActorRolePolicyStatements.createMany({
    data: [
      //politicas para el rol ARRENDADO
      {
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
        policy_statement_id: POLICIES_STATEMENTS.VER_INMUEBLE,
      },
      {
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
        policy_statement_id: POLICIES_STATEMENTS.VER_CONTRATOS,
      },
      {
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
        policy_statement_id: POLICIES_STATEMENTS.DESCARGAR_CONTRATOS,
      },
      {
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
        policy_statement_id: POLICIES_STATEMENTS.VER_DOCUMENTOS_CONTRATO,
      },
      {
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
        policy_statement_id: POLICIES_STATEMENTS.CONSULTAR_SERVICIOS_PUBLICOS,
      },
      {
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
        policy_statement_id:
          POLICIES_STATEMENTS.CONSULTAR_FACTURAS_SERVICIOS_PUBLICOS,
      },
      {
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
        policy_statement_id:
          POLICIES_STATEMENTS.CONSULTAR_CONSUMOS_SERVICIOS_PUBLICOS,
      },
      {
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
        policy_statement_id:
          POLICIES_STATEMENTS.CONSULTAR_PAGOS_SERVICIOS_PUBLICOS,
      },
      {
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
        policy_statement_id:
          POLICIES_STATEMENTS.DESCARGAR_FACTURAS_SERVICIOS_PUBLICOS,
      },
      {
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
        policy_statement_id:
          POLICIES_STATEMENTS.VER_HISTORIAL_SERVICIOS_PUBLICOS,
      },

      //politicas para el rol ARRENDADO_PRELIMINAR
      {
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.PRELIMINARY_TENANT,
        policy_statement_id: POLICIES_STATEMENTS.VER_INMUEBLE,
      },
      {
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.PRELIMINARY_TENANT,
        policy_statement_id: POLICIES_STATEMENTS.VER_CONTRATOS,
      },
      //politicas para el rol MIEMBRO (las personas que se invitan y aceptan)
      // y estan a la espera de un en especifico
      {
        propertyActorRoleId: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.MIEMBRO,
        policy_statement_id: POLICIES_STATEMENTS.VER_INMUEBLE,
      },

      //ROL DE PROPIETARIO POSEE TODOS LOS PERMISOS POSIBLES EN
      // LA APLICACION
    ],
  });
}

await main().finally(() => prisma.$disconnect());
