truncate stations, hops, trains, agents;

--------
-- GAMES
--------

insert into games (name, label, "createdAt", "updatedAt") values ('one', 'Game #1', now(), now());

-----------
-- STATIONS
-----------

insert into stations (name, title, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'a', 'Greedon Way', 'A', 50, 150, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'b', 'Wofford Moor', 'B', 90, 150, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'c', 'Grunham Vale', 'C', 130, 50, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'd', 'Diplo East', 'D', 170, 50, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'e', 'Minstowe North', 'E', 130, 250, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'f', 'Badgers Mere', 'F', 170, 250, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'g', 'Cowstone East', 'G', 210, 150, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'h', 'Lefting Cross', 'H', 250, 150, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'i', 'Fayre Holt', 'I', 210, 350, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'j', 'Rivermouth Mount', 'J', 90, 350, g.id, now(), now()
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

insert into trains (name, title, label, color, distance, speed, "maxWaitTime", "currentWaitTime", "gameId", "stationId", "hopId", "createdAt", "updatedAt")
(
  select 'blue', 'Blue', 'Example train #1', '#4040ff', 0, 1, 3, 0, g.id, s.id, null, now(), now()
  from games as g, stations as s
  where g.name='one' and s.name='c'
);

insert into trains (name, title, label, color, distance, speed, "maxWaitTime", "currentWaitTime", "gameId", "stationId", "hopId", "createdAt", "updatedAt")
(
  select 'red', 'Red', 'Example train #2', '#ff4040', 1, 1, 3, 0, g.id, NULL, h.id, now(), now()
  from games as g, hops as h
  where g.name='one' and h.label = 'Hop from C to D'
);

insert into trains (name, title, label, color, distance, speed, "maxWaitTime", "currentWaitTime", "gameId", "stationId", "hopId", "createdAt", "updatedAt")
(
  select 'green', 'Green', 'Example train #3', '#40ff40', 1, 1, 3, 0, g.id, NULL, h.id, now(), now()
  from games as g, hops as h
  where g.name='one' and h.label = 'Hop from H to I'
);

---------
-- AGENTS
---------

insert into agents (name, title, label, "gameId", "stationId", "trainId", "createdAt", "updatedAt")
(
  select 'alice', 'Alice', 'Started on a train', g.id, null, t.id, now(), now()
  from games as g, trains as t
  where g.name='one' and t.name='blue'
);

insert into agents (name, title, label, "gameId", "stationId", "trainId", "createdAt", "updatedAt")
(
  select 'bob', 'Bob', 'Started in a station', g.id, s.id, null, now(), now()
  from games as g, stations as s
  where g.name='one' and s.name='i'
);

insert into agents (name, title, label, "gameId", "stationId", "trainId", "createdAt", "updatedAt")
(
  select 'eve', 'Eve', 'Started in a station', g.id, s.id, null, now(), now()
  from games as g, stations as s
  where g.name='one' and s.name='j'
);