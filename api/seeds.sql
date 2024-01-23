truncate stations, hops, trains, agents;

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
  select 'Hop from A to B', 3, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='a' and s2.name='b'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from B to C', 3, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='b' and s2.name='c'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from B to E', 3, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='b' and s2.name='e'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from C to D', 3, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='c' and s2.name='d'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from E to F', 3, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='e' and s2.name='f'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from D to G', 3, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='d' and s2.name='g'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from F to G', 3, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='f' and s2.name='g'
);

insert into hops (label, length, "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from G to H', 3, s1.id, s2.id, now(), now()
  from stations as s1, stations as s2
  where s1.name='g' and s2.name='h'
);

insert into trains (name, label, distance, speed, "stationId", "hopId", "createdAt", "updatedAt")
(
  select 'Blue', 'Example train #1', 0, 1, s.id, null, now(), now()
  from stations as s
  where s.name='c'
);

insert into trains (name, label, distance, speed, "stationId", "hopId", "createdAt", "updatedAt")
(
  select 'Blue', 'Example train #1', 1, 1, s.id, h.id, now(), now()
  from stations as s, hops as h
  where s.name='c' and h.label = 'Hop from C to D'
);

insert into agents (name, label, "stationId", "trainId", "createdAt", "updatedAt")
(
  select 'Blue', 'Example train #1', s.id, null, now(), now()
  from stations as s
  where s.name='b'
);
