# Mornington

Created by [Roger Jungemann](https://phasor.space)

## What is Mornington?

Mornington is a sort of simulation, or [zero-player game](https://en.wikipedia.org/wiki/Zero-player_game), in the vein of [Blaseball](https://en.wikipedia.org/wiki/Blaseball). Instead of simulating games of baseball, Mornington simulates games of [Mornington Crescent](https://en.wikipedia.org/wiki/Mornington_Crescent_(game)).

![image](https://github.com/rjungemann/mornington/assets/49277/35b4e135-b3db-42f6-b236-27366d6d4661)

## Setup

Have NodeJS and `yarn` installed on your machine, as well as Postgres.

Clone the `mornington` repo. `cd mornington`

```sh
# Setup backend prerequisites
pushd api
yarn install
yarn db:all
popd

# Setup frontend prerequisites
pushd app
yarn install
popd

# Start the API service
# In another terminal,
cd api
yarn start:api

# Start the clock, which runs the simulation
# In another terminal,
cd api
yarn start:clock

# Start the frontend app
# In another terminal,
cd app
yarn dev
```

## Structure

TODO
