truncate games, "gameTurns", stations, lines, hops, trains, agents;

--------
-- GAMES
--------

insert into games (name, title, label, "createdAt", "updatedAt") values ('one', 'Game #1', 'Game #1', now(), now());

-----------
-- STATIONS
-----------

insert into stations (name, title, label, virtual, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'z', 'Z', 'Z', TRUE, 150, 50, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, virtual, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'x', 'X', 'X', TRUE, 150, 250, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, virtual, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'a', 'Greedon Way', 'A', FALSE, 10, 175, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, virtual, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'b', 'Wofford Moor', 'B', FALSE, 70, 150, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, virtual, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'c', 'Grunham Vale', 'C', FALSE, 110, 50, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, virtual, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'd', 'Diplo East', 'D', FALSE, 190, 50, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, virtual, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'e', 'Minstowe North', 'E', FALSE, 110, 250, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, virtual, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'f', 'Badgers Mere', 'F', FALSE, 190, 250, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, virtual, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'g', 'Cowstone East', 'G', FALSE, 230, 150, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, virtual, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'h', 'Lefting Cross', 'H', FALSE, 290, 175, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, virtual, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'i', 'Fayre Holt', 'I', FALSE, 230, 350, g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into stations (name, title, label, virtual, x, y, "gameId", "createdAt", "updatedAt")
(
  select 'j', 'Rivermouth Mount', 'J', FALSE, 70, 350, g.id, now(), now()
  from games as g
  where g.name='one'
);

--------
-- LINES
--------

insert into lines (name, title, label, color, "gameId", "createdAt", "updatedAt")
(
  select 'blue', 'Blue Line', 'Blue', '#1d4ed8', g.id, now(), now()
  from games as g
  where g.name='one'
);

insert into lines (name, title, label, color, "gameId", "createdAt", "updatedAt")
(
  select 'red', 'Red Line', 'Red', '#b91c1c', g.id, now(), now()
  from games as g
  where g.name='one'
);

-------
-- HOPS
-------

-- Blue lines

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from A to B', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='a' and s2.name='b' and l.name='blue'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from B to C', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='b' and s2.name='c' and l.name='blue'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from B to E', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='b' and s2.name='e' and l.name='blue'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from C to Z', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='c' and s2.name='z' and l.name='blue'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from Z to D', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='z' and s2.name='d' and l.name='blue'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from E to X', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='e' and s2.name='x' and l.name='blue'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from X to F', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='x' and s2.name='f' and l.name='blue'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from D to G', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='d' and s2.name='g' and l.name='blue'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from F to G', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='f' and s2.name='g' and l.name='blue'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from G to H', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='g' and s2.name='h' and l.name='blue'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from H to I', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='h' and s2.name='i' and l.name='blue'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from I to J', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='i' and s2.name='j' and l.name='blue'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from J to A', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='j' and s2.name='a' and l.name='blue'
);

-- Red lines

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from B to C', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='b' and s2.name='c' and l.name='red'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from C to Z', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='c' and s2.name='z' and l.name='red'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from Z to D', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='z' and s2.name='d' and l.name='red'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from D to G', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='d' and s2.name='g' and l.name='red'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from G to F', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='g' and s2.name='f' and l.name='red'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from F to X', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='f' and s2.name='x' and l.name='red'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from X to E', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='x' and s2.name='e' and l.name='red'
);

insert into hops (label, length, "gameId", "headId", "tailId", "lineId", "createdAt", "updatedAt") 
(
  select 'Hop from E to B', 3, g.id, s1.id, s2.id, l.id, now(), now()
  from games as g, stations as s1, stations as s2, lines as l
  where g.name='one' and s1.name='e' and s2.name='b' and l.name='red'
);

---------
-- TRAINS
---------

-- Blue trains

insert into trains (name, title, label, color, distance, speed, "maxWaitTime", "currentWaitTime", "gameId", "stationId", "hopId", "lineId", "createdAt", "updatedAt")
(
  select 'blue:1', 'Blue #1', 'Example train #1', '#60a5fa', 0, 1, 3, 0, g.id, s.id, NULL, l.id, now(), now()
  from games as g, stations as s, lines as l
  where g.name='one' and s.name='c' and l.name='blue'
);

insert into trains (name, title, label, color, distance, speed, "maxWaitTime", "currentWaitTime", "gameId", "stationId", "hopId", "lineId", "createdAt", "updatedAt")
(
  select 'blue:2', 'Blue #2', 'Example train #2', '#60a5fa', 1, 1, 3, 0, g.id, s.id, NULL, l.id, now(), now()
  from games as g, stations as s, lines as l
  where g.name='one' and s.name='d' and l.name='blue'
);

insert into trains (name, title, label, color, distance, speed, "maxWaitTime", "currentWaitTime", "gameId", "stationId", "hopId", "lineId", "createdAt", "updatedAt")
(
  select 'blue:3', 'Blue #3', 'Example train #3', '#60a5fa', 1, 1, 3, 0, g.id, NULL, h.id, l.id, now(), now()
  from games as g, hops as h, lines as l
  where g.name='one' and h.label = 'Hop from H to I' and l.name='blue'
);

-- Red trains

insert into trains (name, title, label, color, distance, speed, "maxWaitTime", "currentWaitTime", "gameId", "stationId", "hopId", "lineId", "createdAt", "updatedAt")
(
  select 'red', 'Red', 'Example train #4', '#f87171', 0, 1, 3, 0, g.id, s.id, NULL, l.id, now(), now()
  from games as g, stations as s, lines as l
  where g.name='one' and s.name='d' and l.name='red'
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