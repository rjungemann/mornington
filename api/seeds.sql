truncate stations, hops, trains, agents;

--------
-- GAMES
--------

insert into games (name, label, "createdAt", "updatedAt") values ('one', 'Game #1', now(), now());

-----------
-- STATIONS
-----------

insert into stations (name, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'a', 'A', 50, 150, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'b', 'B', 90, 150, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'c', 'C', 130, 50, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'd', 'D', 170, 50, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'e', 'E', 130, 250, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'f', 'F', 170, 250, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'g', 'G', 210, 150, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'h', 'H', 250, 150, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'i', 'I', 210, 350, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'j', 'J', 90, 350, g.id, now(), now()
  from games as g
  where g.name='one'
);

-------
-- HOPS
-------

insert into hops (label, length, "gameId", "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from A to B', 3, g.id, s1.id, s2.id, now(), now()
  from games as g, stations as s1, stations as s2
  where g.name='one' and s1.name='a' and s2.name='b'
);

insert into hops (label, length, "gameId", "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from B to C', 3, g.id, s1.id, s2.id, now(), now()
  from games as g, stations as s1, stations as s2
  where g.name='one' and s1.name='b' and s2.name='c'
);

insert into hops (label, length, "gameId", "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from B to E', 3, g.id, s1.id, s2.id, now(), now()
  from games as g, stations as s1, stations as s2
  where g.name='one' and s1.name='b' and s2.name='e'
);

insert into hops (label, length, "gameId", "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from C to D', 3, g.id, s1.id, s2.id, now(), now()
  from games as g, stations as s1, stations as s2
  where g.name='one' and s1.name='c' and s2.name='d'
);

insert into hops (label, length, "gameId", "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from E to F', 3, g.id, s1.id, s2.id, now(), now()
  from games as g, stations as s1, stations as s2
  where g.name='one' and s1.name='e' and s2.name='f'
);

insert into hops (label, length, "gameId", "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from D to G', 3, g.id, s1.id, s2.id, now(), now()
  from games as g, stations as s1, stations as s2
  where g.name='one' and s1.name='d' and s2.name='g'
);

insert into hops (label, length, "gameId", "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from F to G', 3, g.id, s1.id, s2.id, now(), now()
  from games as g, stations as s1, stations as s2
  where g.name='one' and s1.name='f' and s2.name='g'
);

insert into hops (label, length, "gameId", "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from G to H', 3, g.id, s1.id, s2.id, now(), now()
  from games as g, stations as s1, stations as s2
  where g.name='one' and s1.name='g' and s2.name='h'
);

insert into hops (label, length, "gameId", "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from H to I', 3, g.id, s1.id, s2.id, now(), now()
  from games as g, stations as s1, stations as s2
  where g.name='one' and s1.name='h' and s2.name='i'
);

insert into hops (label, length, "gameId", "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from I to J', 3, g.id, s1.id, s2.id, now(), now()
  from games as g, stations as s1, stations as s2
  where g.name='one' and s1.name='i' and s2.name='j'
);

insert into hops (label, length, "gameId", "headId", "tailId", "createdAt", "updatedAt") 
(
  select 'Hop from J to A', 3, g.id, s1.id, s2.id, now(), now()
  from games as g, stations as s1, stations as s2
  where g.name='one' and s1.name='j' and s2.name='a'
);

---------
-- TRAINS
---------

insert into trains (name, label, distance, speed, "maxWaitTime", "currentWaitTime", "gameId", "stationId", "hopId", "createdAt", "updatedAt")
(
  select 'Blue', 'Example train #1', 0, 1, 3, 0, g.id, s.id, null, now(), now()
  from games as g, stations as s
  where g.name='one' and s.name='c'
);

insert into trains (name, label, distance, speed, "maxWaitTime", "currentWaitTime", "gameId", "stationId", "hopId", "createdAt", "updatedAt")
(
  select 'Red', 'Example train #2', 1, 1, 3, 0, g.id, s.id, h.id, now(), now()
  from games as g, stations as s, hops as h
  where g.name='one' and s.name='c' and h.label = 'Hop from C to D'
);

---------
-- AGENTS
---------

insert into agents (name, label, "gameId", "stationId", "trainId", "createdAt", "updatedAt")
(
  select 'Blue', 'Example train #1', g.id, s.id, null, now(), now()
  from games as g, stations as s
  where g.name='one' and s.name='b'
);
