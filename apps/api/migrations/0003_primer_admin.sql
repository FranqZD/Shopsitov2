-- Primer admin de dev y de prod (un id por ambiente): en la nube no hay seed que lo cree.
-- Si el id no existe en la base (p. ej. en local), no cambia nada.
UPDATE `usuarios` SET `rol` = 'admin' WHERE `id` IN (
  '3d633078-681f-4d2f-aa51-c2fa6ff85169',
  'd0c3d7c4-f1a1-4bd3-821c-a0bf4d9c663c'
);
