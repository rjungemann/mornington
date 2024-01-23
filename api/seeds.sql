truncate stations, hops;

insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('a', 'A', 0, 150, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('b', 'B', 90, 150, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('c', 'C', 130, 50, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('d', 'D', 170, 50, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('e', 'E', 130, 250, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('f', 'F', 170, 250, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('g', 'G', 210, 150, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('h', 'H', 250, 150, now(), now());

insert into hops (label, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from A to B', s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='a' and s2.name='b'
);

insert into hops (label, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from B to C', s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='b' and s2.name='c'
);

insert into hops (label, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from B to E', s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='b' and s2.name='e'
);

insert into hops (label, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from C to D', s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='c' and s2.name='d'
);

insert into hops (label, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from E to F', s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='e' and s2.name='f'
);

insert into hops (label, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from D to G', s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='d' and s2.name='g'
);

insert into hops (label, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from F to G', s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='f' and s2.name='g'
);

insert into hops (label, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from G to H', s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='g' and s2.name='h'
);