# homelab-showcase

This site shows a diagram of a homelab's zones, services, and connections. Visitors can select scripted scenarios to see packets follow the declared connections and can inspect individual nodes for their details.

## Architecture

The topology is defined in `src/data/topology.json`. It contains zones, nodes, and edges. The page renders the JSON as SVG and calculates node positions and edge paths from the layout rules. Each edge is declared once with a source and destination. `bidirectional` controls its arrowheads; scenario hops refer to edge IDs, and `reverse` controls packet direction during playback.

## Run locally

```sh
npm install
npm run dev
```

Open the address printed by Vite. To validate the data and create a production build:

```sh
npm run validate
npm run build
```

The flows are scripted and synthetic. They are not live telemetry or service health data.

## Decisions

See [DECISIONS.md](./DECISIONS.md) for the project decisions about topology and flow direction.
