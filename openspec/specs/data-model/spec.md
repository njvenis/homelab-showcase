# data-model Specification

## Purpose
Provides a single, typed and validated JSON source for the homelab topology and scripted flows so later rendering and animation code cannot consume inconsistent references.

## Requirements

### Requirement: Topology and scenarios use a typed data contract

The project SHALL define TypeScript representations for `Zone`, `Node`, `Edge`, `Scenario`, and `Hop` that match the JSON data consumed by the site. The topology data SHALL contain the zones, nodes, and edges described by runbook section 3, and the scenario data SHALL contain the five named flows described by runbook section 4. Topology and scenario content SHALL remain in JSON rather than being duplicated in rendering code.

#### Scenario: Valid project data loads

- **GIVEN** the topology and scenario JSON contain the runbook's declared zones, nodes, edges, and five scenarios
- **WHEN** the data is loaded by the application
- **THEN** the loader returns data conforming to the TypeScript contract without duplicating content in code

### Requirement: All topology references are validated

The loader SHALL validate node zone references and edge endpoint references while the data module is loaded. If a reference cannot be resolved, loading SHALL throw an error that names the unresolved id and identifies the invalid reference.

#### Scenario: Edge references a missing node

- **GIVEN** an edge references a node id that does not exist in the topology
- **WHEN** the data module is loaded
- **THEN** loading throws an error naming the missing node id

#### Scenario: Node references a missing zone

- **GIVEN** a node declares a zone id that does not exist in the topology
- **WHEN** the data module is loaded
- **THEN** loading throws an error naming the missing zone id

### Requirement: Scenario hop references are validated

The loader SHALL validate that every scenario hop references an existing edge id. A hop with `reverse: true` SHALL only be valid when its referenced edge has `bidirectional: true`; invalid hops SHALL cause loading to throw an error naming the relevant id.

#### Scenario: Hop references a missing edge

- **GIVEN** a scenario hop references an edge id that does not exist
- **WHEN** the data module is loaded
- **THEN** loading throws an error naming the missing edge id

#### Scenario: Reverse hop uses a one-way edge

- **GIVEN** a scenario hop sets `reverse: true` on an edge without `bidirectional: true`
- **WHEN** the data module is loaded
- **THEN** loading throws an error naming the edge id
- **AND** reduced-motion handling does not change this validation rule; a reduced-motion renderer consumes the same validated scenario data without travelling packets

### Requirement: Validation runs before builds

The project SHALL provide a standalone validation command that loads the same data through the loader, exits successfully for valid data, and exits unsuccessfully with the loader's actionable error for invalid data. The build command SHALL invoke validation before compiling or bundling.

#### Scenario: Invalid data blocks a build

- **GIVEN** a topology or scenario reference is invalid
- **WHEN** the validation command or build command runs
- **THEN** the process exits non-zero and reports the offending id before a successful build can complete
