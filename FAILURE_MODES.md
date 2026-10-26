# FactoryMind AI — Machine-Specific Failure Modes

**Question this answers:** *"Every machine fails for a different reason, so how
does the simulation show which parameter is failing, at what threshold, and what
to do about it?"*

Each production cell has **its own failure mode**, driven by **one failing
parameter** and judged against **that machine's own warning and critical
limits**. When a failure is injected, only that parameter is pushed out of
range. The AI agents then detect it, name it, and recommend the repair that fits
that machine.

Source of truth: [`factorymind-next/lib/failureModes.ts`](factorymind-next/lib/failureModes.ts).
The simulation, the agents and the UI all read from this one table, so the
numbers below are the numbers the demo uses.

---

## 1. Failure mode per machine

| Cell | Machine | Failure mode | **Failing parameter** | Warning | Critical | Repair (simulated) | Repair time |
|---|---|---|---|---|---|---|---|
| CELL-01 | CNC-01 Milling | Cutter wear / tool breakage | **Cutter wear** (%) | > 60 % | > 85 % | Cutting tool replacement | 15 min |
| CELL-02 | 6-Axis Robotic Arm | Joint reducer backlash / servo vibration | **Arm joint vibration** (mm/s) | > 1.8 mm/s | > 3.5 mm/s | Joint reducer replacement & recalibration | 30 min |
| CELL-04 | CNC-07 Heavy Lathe | Spindle bearing wear / overheating | **Spindle bearing vibration** (mm/s) | > 2.2 mm/s | > 4.5 mm/s | Spindle bearing replacement | 25 min |
| CELL-05 | Hydraulic Press | Hydraulic oil overheating / seal leak | **Hydraulic oil temperature** (°C) | > 65 °C | > 80 °C | Oil cooler service & seal replacement | 30 min |
| CELL-03 | Outfeed Conveyor | Belt slip / drive motor overload | **Belt speed** (% of commanded) | < 80 % | < 60 % | Belt re-tension & drive roller service | 20 min |

Belt speed is the only parameter that alarms when it goes **below** its limit.
It is measured against the speed the drive commands at the current load, and it
is not judged for the first ~10 s after a start, while the drive spins up.

## 2. All limits per machine

Every machine also has its own limits for the other signals. These drive the
machine's status (healthy, warning or critical), the operator checklist, and
the agents' evidence.

| Machine | Temperature warn / crit | Vibration warn / crit | Wear warn / crit |
|---|---|---|---|
| CNC-01 Milling | 78 / 92 °C | 2.2 / 4.6 mm/s | **60 / 85 %** |
| Robotic Arm | **70 / 85 °C** (servo) | **1.8 / 3.5 mm/s** | 70 / 90 % |
| CNC-07 Lathe | 78 / 92 °C | 2.2 / **4.5** mm/s | 70 / 90 % |
| Hydraulic Press | **65 / 80 °C** (oil) | 2.5 / 5.0 mm/s | 70 / 90 % |
| Outfeed Conveyor | 72 / 88 °C (motor) | 2.5 / 5.0 mm/s | 70 / 90 % |
| AS/RS, CNC-05 standby | 78 / 92 °C | 2.2 / 4.6 mm/s | 70 / 90 % |

Health below 72 % is a warning and below 45 % is critical, on every machine.

## 3. How the fault changes the telemetry

The fault develops gradually (`progress` 0 → 1, about 27 s at severity 1.0).
At full development, each mode adds the following to the physics:

| Machine | Extra heat | Extra vibration | Wear reaches | Speed lost | What you see |
|---|---|---|---|---|---|
| CNC-01 | +4 °C | +0.6 mm/s | 95 % | — | Cutter wear climbs past 60 → 85 %; chatter and heat follow |
| Robot | +8 °C | +2.4 mm/s | 45 % | 10 % | Joint vibration rises first; the servo warms |
| CNC-07 | +6 °C | +0.8 mm/s | 75 % | — | Bearing vibration rises with wear; friction heat follows |
| Press | **+32 °C** | +0.6 mm/s | 35 % | 5 % | Oil temperature climbs fast past 65 → 80 °C |
| Conveyor | +14 °C | +0.9 mm/s | 40 % | **55 %** | Belt speed falls below 80 → 60 %; the motor overheats |

Because only the machine's own parameter is pushed hard, **each machine
crosses a different limit first**. That is why the timeline reads differently
for each one.

## 4. What the user sees

1. **Failure Simulator.** Picking a machine shows its failure mode, its failing
   parameter, its limits and the cause before you inject the fault.
2. **AI intervention timeline.** The parameter is named explicitly:
   - `Failing parameter: Hydraulic oil temperature 65.2 °C crossed the CELL-05 warning limit (65.0 °C)`
   - `Failing parameter: Hydraulic oil temperature 80.1 °C crossed the CELL-05 CRITICAL limit (80.0 °C)`
3. **Failing Parameter card** (Command Center and operator view). It shows the
   live value, a gauge with the warning and critical markers, the machine's
   other limits, the component and cause, and the **recommended actions**.
4. **Maintenance Agent diagnosis.** It names the failure mode and puts the
   failing parameter first in the evidence. The mission and isolation request
   carry `failingParameter` and `recommendedActions`.
5. **Recovery plan.** The repair step and the expected repair time are
   machine-specific, so the impact analysis estimates lost units with the
   right outage length.
6. **Breakdown** (if nobody acts). The message is machine-specific, for example
   "hydraulic oil overheated — pump tripped and ram seal blew".

## 5. Recommended actions

| Machine | Recommended action (in order) |
|---|---|
| CNC-01 | Stop the spindle and replace the end mill / insert → re-measure the tool-length offset and re-zero → check coolant concentration and flow → inspect the last parts |
| Robot | Stop the arm and lock out (LOTO) → inspect the J2/J3 harmonic reducer for backlash → check servo current and encoder → re-grease and recalibrate the TCP |
| CNC-07 | Isolate and lock out the spindle → replace the main spindle bearing → check lubrication → controlled run-in at ≤ 65 % load |
| Press | Stop the pump and relieve pressure → clean the oil cooler and check its fan → replace leaking ram/cylinder seals → check the oil level and grade (ISO VG 46) |
| Conveyor | Stop the belt and lock out the drive → re-tension and track the belt → inspect the drive roller lagging and idlers → check motor current and the overload relay |

## 6. Detection: rules + ML

- **Machine-specific rules** (always on): the Maintenance Agent raises a
  critical mission when the failing parameter crosses that machine's critical
  limit, or when health drops below 45 %.
- **ML** (LightGBM + Random Forest): adds a failure probability. The model was
  trained on AI4I 2020 features (temperature, torque, tool wear, speed). It
  reacts strongly to wear and vibration (CNC-01, CNC-07, robot) but weakly to a
  belt-speed drop, which it never saw in training. On the conveyor, the
  machine-specific speed limit catches the fault even when ML scores only ~2 %.
  That is why both layers exist.

## 7. Adding or changing a failure mode

Edit `FAILURE_MODES` / `MACHINE_LIMITS` in `factorymind-next/lib/failureModes.ts`.
The simulation physics, status colours, operator checks, agent diagnosis,
recovery plan and UI all pick up the change. No other file needs to be changed.
