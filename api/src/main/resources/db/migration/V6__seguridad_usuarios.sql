-- ============================================================================
-- V6: credenciales y control de acceso
-- La aplicación pasa a exigir inicio de sesión. Solo el administrador inicial
-- tiene contraseña; el resto se habilita cuando el administrador se la asigne.
-- ============================================================================

ALTER TABLE usuarios
  ADD COLUMN password_hash VARCHAR(100) NULL AFTER email,
  ADD COLUMN ultimo_acceso TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN intentos_fallidos INT NOT NULL DEFAULT 0,
  ADD COLUMN bloqueado_hasta TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Contraseña temporal del administrador, guardada solo como hash bcrypt
-- (coste 10). Se entrega por un canal privado y debe cambiarse al primer inicio.
UPDATE usuarios
   SET password_hash = '$2b$10$pqWL2hK8KOUeFAJMWq8wCu5SaA1b5pWQWIJHSbh6TlJRYJN4C4UfO',
       debe_cambiar_password = TRUE
 WHERE email = 'jhonn@genomicaandina.co';
