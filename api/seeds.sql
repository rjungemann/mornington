truncate stations, hops, agents;

insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('a', 'A', 0, 150, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('b', 'B', 90, 150, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('c', 'C', 130, 50, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('d', 'D', 170, 50, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('e', 'E', 130, 250, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('f', 'F', 170, 250, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('g', 'G', 210, 150, now(), now());
insert into stations (name, label, x, y, "createdAt", "updatedAt") values ('h', 'H', 250, 150, now(), now());

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from A to B', 1, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='a' and s2.name='b'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from B to C', 1, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='b' and s2.name='c'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from B to E', 1, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='b' and s2.name='e'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from C to D', 1, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='c' and s2.name='d'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from E to F', 1, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='e' and s2.name='f'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from D to G', 1, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='d' and s2.name='g'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from F to G', 1, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='f' and s2.name='g'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from G to H', 1, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='g' and s2.name='h'
);

insert into agents (name, label, distance, "currentStationId", "currentHopId", "createdAt", "updatedAt")
(
  select 'Alice', 'Example agent #1', 0, s.id, null, now(), now()
  from stations as s
  where s.name='c'
);
