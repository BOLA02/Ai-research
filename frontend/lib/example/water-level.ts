import type { ExamplePart } from "./types";

/**
 * A complete worked example for an EEE design project. Everything here is invented for teaching:
 * the student, the measurements and the cited works are fictional. Reference entries show the
 * IEEE format only and are not real sources.
 */
export const EXAMPLE_TITLE = "Design and Construction of an Automatic Water Level Controller";
export const EXAMPLE_STUDENT = "Musa Ibrahim";

const CH1 = "Chapter 1: Introduction";
const CH2 = "Chapter 2: Literature Review";
const CH3 = "Chapter 3: Design Methodology";
const CH4 = "Chapter 4: Construction and Packaging";
const CH5 = "Chapter 5: Testing and Result";
const CH6 = "Chapter 6: Conclusions and Recommendations";

export const exampleParts: ExamplePart[] = [
  {
    id: "cover",
    group: "Front matter",
    number: "",
    title: "Cover Page",
    documentType: "COVER_PAGE",
    blocks: [
      {
        t: "cover",
        lines: [
          "DESIGN AND CONSTRUCTION OF AN AUTOMATIC WATER LEVEL CONTROLLER",
          "",
          "RESEARCH PROJECT BY",
          "MUSA IBRAHIM",
          "KPT/COE/EEE/24/0000",
          "",
          "DEPARTMENT OF ELECTRICAL AND ELECTRONIC ENGINEERING",
          "COLLEGE OF ENGINEERING",
          "KADUNA POLYTECHNIC",
          "KADUNA",
          "",
          "IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE AWARD OF HIGHER NATIONAL DIPLOMA",
          "",
          "2026",
        ],
      },
    ],
    why: {
      headline: "The cover is the first thing an examiner sees, so it must be exact.",
      points: [
        { text: "Everything is in capital letters. Your department sets 16 pt for the cover and 14 pt for the title page." },
        { text: "The title is specific: it says what is built (a controller), what it does (automatic water level) and the kind of work (design and construction)." },
        { text: "The title, your name and your registration number must match the abstract and approval page exactly." },
      ],
      mistakes: ["Changing the title between the cover and the abstract.", "Using the wrong year or department name."],
    },
  },
  {
    id: "abstract",
    group: "Front matter",
    number: "",
    title: "Abstract",
    documentType: "ABSTRACT",
    blocks: [
      {
        t: "p",
        mark: 1,
        text: "Manual control of overhead water tanks wastes water and electricity. Tanks overflow when the pump is left running, and the pump runs dry when it is forgotten.",
      },
      {
        t: "p",
        mark: 2,
        text: "This project designed, constructed and tested an automatic water level controller that switches a 0.5 hp pump on when the water falls below a low-level probe and off when it reaches a high-level probe. The design used a 12 V regulated supply, transistor probe-sensing stages and a relay driver. The circuit was simulated, built on Vero board and housed in a plastic enclosure.",
      },
      {
        t: "p",
        mark: 3,
        text: "In tests on a 200-litre tank over ten fill cycles, the pump switched on at a mean of 51.0 litres and off at a mean of 179.8 litres every time, and the regulated supply stayed between 11.97 V and 12.02 V from no load to full load.",
      },
      {
        t: "p",
        mark: 4,
        text: "The controller met all four objectives. It shows that reliable automatic level control is achievable with low-cost, locally available components.",
      },
    ],
    why: {
      headline: "The whole project in miniature, in four short paragraphs.",
      points: [
        { text: "It opens with the problem in two sentences.", mark: 1 },
        { text: "It says what you did and how: design, simulation, construction.", mark: 2 },
        { text: "It gives the most important results with real numbers, not just 'it worked'.", mark: 3 },
        { text: "It closes with what the results mean.", mark: 4 },
        { text: "It has no figures, tables or citations, which your guidelines say to leave out of the abstract." },
      ],
      mistakes: ["Writing it first. Write it last, when you know your results.", "Copying the introduction into it.", "Adding citations or 'see Figure 1'."],
    },
  },
  {
    id: "background",
    group: CH1,
    number: "1.1",
    title: "Background of the Report",
    templateKey: "background",
    blocks: [
      {
        t: "p",
        mark: 1,
        text: "Water is stored in overhead tanks in most Nigerian homes, hostels and institutions because the public supply is irregular [1]. A pump lifts water from a borehole or a well into the tank, and gravity then supplies the taps.",
      },
      {
        t: "p",
        mark: 2,
        text: "Most pumps are still switched on and off by hand. Studies of domestic pumping show that manual operation is the main reason for overflow and for pumps running without water [2]. Each wastes water and electricity, and dry running can burn out the motor.",
      },
      {
        t: "p",
        mark: 3,
        text: "An automatic controller removes this human step. It senses the water level and switches the pump by itself, so the tank stays between a safe minimum and maximum.",
      },
    ],
    why: {
      headline: "Start wide, then narrow to your project.",
      points: [
        { text: "It begins with the everyday situation the reader already knows.", mark: 1 },
        { text: "It narrows to the specific cause of the trouble and backs the claim with a source.", mark: 2 },
        { text: "It ends by pointing at the solution, which leads into your problem statement.", mark: 3 },
      ],
      mistakes: ["Starting with a history of electricity.", "Making claims without citing a source.", "Citing many studies. Choose only the ones that support your point."],
    },
  },
  {
    id: "problem",
    group: CH1,
    number: "1.2",
    title: "Statement of the Problem",
    templateKey: "problem-statement",
    blocks: [
      {
        t: "p",
        mark: 1,
        text: "Operators of overhead tanks must watch the water level and switch the pump by hand. This causes two faults.",
      },
      {
        t: "list",
        ordered: true,
        mark: 2,
        items: [
          "Overflow. The pump is left on after the tank is full, so water and electricity are wasted.",
          "Dry running. The pump is not switched on in time, or runs after the source is empty, and the motor can overheat.",
        ],
      },
      {
        t: "p",
        mark: 3,
        text: "Commercial controllers that solve this exist, but they are expensive for the average household or hostel [3]. A low-cost controller built from locally available parts is needed.",
      },
    ],
    why: {
      headline: "Name the problem, who it affects and why existing answers don't fit.",
      points: [
        { text: "One clear sentence states what is wrong.", mark: 1 },
        { text: "The faults are listed so each one can be tested later.", mark: 2 },
        { text: "It says why current solutions fall short, which justifies your project.", mark: 3 },
      ],
      mistakes: ["Describing your solution here instead of the problem.", "Stating a problem that your project doesn't actually solve."],
    },
  },
  {
    id: "aim",
    group: CH1,
    number: "1.3",
    title: "Aim and Objectives of the Study",
    templateKey: "aim-objectives",
    blocks: [
      {
        t: "p",
        mark: 1,
        text: "The aim of this project is to design and construct a low-cost automatic controller that keeps an overhead water tank between a set low level and a set high level.",
      },
      { t: "p", text: "The objectives are to:" },
      {
        t: "list",
        mark: 2,
        items: [
          "design a 12 V regulated power supply rated at 100 mA;",
          "design probe-sensing and relay-driver stages that switch a pump relay;",
          "construct the circuit and package it in a suitable enclosure; and",
          "test that the pump switches on at the low level and off at the high level in ten consecutive fill cycles.",
        ],
      },
    ],
    why: {
      headline: "The aim is the goal. The objectives are the steps, and each one can be tested.",
      points: [
        { text: "The aim is a single sentence about the outcome.", mark: 1 },
        { text: "Each objective starts with a verb and has a number or a clear test: '12 V', '100 mA', 'ten cycles'.", mark: 2 },
        { text: "Chapters 3, 4 and 5 line up with these objectives, and Chapter 6 judges the project against them." },
      ],
      mistakes: ["Vague objectives such as 'to study water control'.", "Objectives you never test in Chapter 5.", "Listing ten of them. Three to five is enough."],
    },
  },
  {
    id: "scope",
    group: CH1,
    number: "1.5",
    title: "Scope of the Study",
    templateKey: "scope",
    blocks: [
      {
        t: "p",
        mark: 1,
        text: "The controller is designed for a single-phase pump of up to 0.5 hp (about 373 W) on a 230 V, 50 Hz supply. At 230 V the pump draws about 1.6 A while running. The relay contacts are rated at 10 A, which allows for the higher current at start-up.",
      },
      {
        t: "p",
        mark: 2,
        text: "The study does not cover three-phase pumps, remote monitoring, or detecting an empty borehole.",
      },
    ],
    why: {
      headline: "Draw a clear line around what you did and didn't do.",
      points: [
        { text: "It states limits with numbers, so an examiner knows what was designed for.", mark: 1 },
        { text: "It says what is left out. This protects you from questions about things outside the project.", mark: 2 },
      ],
      mistakes: ["Promising more than you built.", "Leaving the limits vague."],
    },
  },
  {
    id: "related",
    group: CH2,
    number: "2.3",
    title: "Review of Related Works",
    templateKey: "related-works",
    blocks: [
      {
        t: "p",
        mark: 1,
        text: "Several approaches to automatic water level control have been reported. Five representative works are compared in Table 1.",
      },
      {
        t: "table",
        mark: 2,
        caption: "Table 1: Comparison of related works",
        head: ["Work", "Method", "Strength", "Limitation"],
        rows: [
          ["[4]", "Float switch with relay", "Very simple", "Moving parts jam and wear"],
          ["[5]", "555 timer with probes", "Cheap, few parts", "Probe corrosion, no latching"],
          ["[6]", "Microcontroller with ultrasonic sensor", "Accurate level reading", "Needs programming skill; costly"],
          ["[7]", "GSM-based remote control", "Works from a distance", "Network cost and dependence"],
          ["[8]", "CMOS logic latch with probes", "Reliable switching", "Needs a regulated supply"],
        ],
        note: "These entries are invented for this example. In your report each row is a real work you have read.",
      },
      {
        t: "p",
        mark: 3,
        text: "Reference [4] used a float switch, which is simple but mechanical parts wear out in dirty water. Reference [6] gave the most accurate reading but needs a programmed microcontroller and an ultrasonic sensor, which raises the cost. The probe-based designs [5] and [8] are cheaper and have no moving parts, but [5] has no latching action, so the pump chatters at the switching level.",
      },
    ],
    why: {
      headline: "Compare other people's work. Don't just list it.",
      points: [
        { text: "The opening sentence tells the reader how many works are covered and where they're compared.", mark: 1 },
        { text: "A table puts method, strength and limitation side by side. Your department asks for at least 5 related works. Tables and figures are numbered 1, 2, 3 through the whole report.", mark: 2 },
        { text: "The discussion explains the trade-offs and cites each work by number.", mark: 3 },
      ],
      mistakes: ["One paragraph per paper with no comparison.", "Fewer than five works.", "Citing a paper you haven't read."],
    },
  },
  {
    id: "gap",
    group: CH2,
    number: "2.5",
    title: "Research Gap",
    templateKey: "research-gap",
    blocks: [
      {
        t: "p",
        mark: 1,
        text: "The works reviewed either depend on moving parts [4], need programming and costly sensors [6][7], or leave out latching so that the pump chatters [5]. None gives a probe-based controller with built-in latching that can be built with common parts at low cost.",
      },
      {
        t: "p",
        mark: 2,
        text: "This project fills that gap with a transistor-based probe-sensing circuit that latches the relay, powered from a regulated 12 V supply.",
      },
    ],
    why: {
      headline: "Show the hole in earlier work, then show how you fill it.",
      points: [
        { text: "The gap comes straight from the limitations in Table 1.", mark: 1 },
        { text: "The last sentence links the gap to your design.", mark: 2 },
      ],
      mistakes: ["Claiming nobody has ever done anything similar.", "A gap that your project doesn't actually fill."],
    },
  },
  {
    id: "spec",
    group: CH3,
    number: "3.2",
    title: "Design Specification",
    templateKey: "design-specification",
    blocks: [
      {
        t: "table",
        mark: 1,
        caption: "Table 2: Design specification",
        head: ["Parameter", "Value"],
        rows: [
          ["Mains input", "230 V AC, 50 Hz"],
          ["Regulated DC supply", "12 V, 100 mA"],
          ["Relay coil", "12 V, 400 Ω"],
          ["Relay contacts", "10 A, 250 V AC"],
          ["Level sensing", "Two stainless-steel probes (low and high)"],
          ["Indication", "LEDs for power and pump ON"],
          ["Operating temperature", "0 to 45 °C"],
        ],
      },
      {
        t: "p",
        mark: 2,
        text: "These values are the requirements that Sections 3.4 and 3.5 design and select components for.",
      },
    ],
    why: {
      headline: "Say exactly what the design must achieve, in numbers with units.",
      points: [
        { text: "A table is easier to scan than a paragraph, and every value has a unit.", mark: 1 },
        { text: "It tells the reader what the next sections will design.", mark: 2 },
      ],
      mistakes: ["Specifying things in words only ('low power').", "Numbers without units."],
    },
  },
  {
    id: "power",
    group: CH3,
    number: "3.4.1",
    title: "Design of Power Supply Unit",
    templateKey: "power-supply-design",
    blocks: [
      {
        t: "p",
        mark: 1,
        text: "A 12 V, 500 mA step-down transformer feeds a bridge rectifier, a filter capacitor and a 7812 regulator. The peak secondary voltage is:",
      },
      { t: "eq", mark: 2, lines: ["V_pk = V_rms × √2 = 12 × 1.414 = 16.97 V"] },
      { t: "p", text: "Two diodes conduct at a time in the bridge, each dropping about 0.7 V:" },
      { t: "eq", lines: ["V_dc(pk) = 16.97 − (2 × 0.7) = 15.57 V ≈ 15.6 V"] },
      { t: "p", text: "For a load current I = 100 mA and an allowed ripple V_r = 1.0 V, the filter capacitor is:" },
      { t: "eq", mark: 3, lines: ["C = I / (2 f V_r) = 0.1 / (2 × 50 × 1.0) = 1.0 mF = 1000 µF", "Chosen: 1000 µF, 25 V"] },
      { t: "p", text: "The lowest input to the regulator is then:" },
      {
        t: "eq",
        mark: 4,
        lines: ["V_min = 15.6 − 1.0 = 14.6 V", "14.6 V > 14 V (12 V output + 2 V dropout), so the regulator stays in regulation."],
      },
    ],
    why: {
      headline: "Show every calculation: the formula, the numbers and the unit.",
      points: [
        { text: "It starts from the component ratings given in the specification.", mark: 1 },
        { text: "Each step shows the formula, then the numbers, then the answer.", mark: 2 },
        { text: "It chooses a standard value (1000 µF) from the calculated one.", mark: 3 },
        { text: "It checks that the design works (14.6 V is above 14 V) rather than assuming.", mark: 4 },
      ],
      mistakes: ["Giving only the final component value.", "Using a value that doesn't exist on the market.", "Forgetting to check the regulator's dropout voltage."],
    },
  },
  {
    id: "driver",
    group: CH3,
    number: "3.4.2",
    title: "Circuit Design: Relay Driver",
    templateKey: "circuit-design",
    blocks: [
      { t: "p", mark: 1, text: "The relay coil is rated at 12 V and 400 Ω, so the coil current is:" },
      { t: "eq", lines: ["I_C = V / R = 12 / 400 = 30 mA"] },
      {
        t: "p",
        mark: 2,
        text: "A BC547 transistor has a minimum current gain h_FE of about 110. To drive it well into saturation, a forced gain of 10 is used:",
      },
      { t: "eq", lines: ["I_B = I_C / 10 = 30 mA / 10 = 3 mA", "R_B = (V_in − V_BE) / I_B = (12 − 0.7) / 3 mA = 3.77 kΩ", "Chosen: 3.9 kΩ (standard value)"] },
      {
        t: "p",
        mark: 3,
        text: "The actual base current is 11.3 V / 3.9 kΩ = 2.9 mA. The minimum base current needed is 30 mA / 110 = 0.27 mA, so the transistor is fully saturated.",
      },
      {
        t: "p",
        mark: 4,
        text: "A 1N4007 diode is connected across the relay coil to absorb the voltage spike when the coil is switched off. The power LED resistor is R = (12 − 2) V / 10 mA = 1 kΩ.",
      },
    ],
    why: {
      headline: "Choose each part for a reason, and prove the choice works.",
      points: [
        { text: "It starts from what the load needs (30 mA).", mark: 1 },
        { text: "It explains the method (forced gain of 10) before using it.", mark: 2 },
        { text: "It checks that the chosen resistor really saturates the transistor.", mark: 3 },
        { text: "It protects the circuit (flyback diode) and explains why.", mark: 4 },
      ],
      mistakes: ["Picking a resistor by 'what looked right'.", "Leaving out the flyback diode.", "Not checking the result against the datasheet."],
    },
  },
  {
    id: "principle",
    group: CH3,
    number: "3.6",
    title: "Circuit Diagram and Principles of Operation",
    templateKey: "circuit-diagram",
    blocks: [
      {
        t: "figure",
        mark: 1,
        caption: "Figure 1: Block diagram of the water level controller",
        nodes: ["230 V mains", "Transformer", "Rectifier and filter", "12 V regulator", "Probe sensing", "Latch and relay driver", "Relay", "Pump"],
      },
      {
        t: "p",
        mark: 2,
        text: "When the water is below the low probe, neither probe is wet. The sensing stage lets the relay driver turn on, the relay energises, and its contact switches the pump on. The relay's second contact latches the driver, so the pump keeps running while the water rises past the low probe.",
      },
      {
        t: "p",
        mark: 3,
        text: "When the water reaches the high probe, the high-probe transistor conducts and releases the latch. The relay de-energises and the pump stops. The pump stays off until the level falls below the low probe again. This gap between the two probes stops the pump from switching on and off rapidly.",
      },
    ],
    why: {
      headline: "A diagram plus a clear walk-through from input to output.",
      points: [
        { text: "The figure is numbered and captioned. Every figure in your report is, and it appears in the List of Figures.", mark: 1 },
        { text: "The first paragraph describes the start of the cycle.", mark: 2 },
        { text: "The second paragraph describes how it ends, and why the two probe levels matter.", mark: 3 },
      ],
      mistakes: ["Pasting a diagram with no explanation.", "Using a diagram from the internet without citing it."],
    },
  },
  {
    id: "construction",
    group: CH4,
    number: "4.2.3",
    title: "Construction Procedures",
    templateKey: "construction-procedure",
    blocks: [
      { t: "p", mark: 1, text: "The circuit was constructed on Vero board in the following order." },
      {
        t: "list",
        ordered: true,
        mark: 2,
        items: [
          "The layout was drawn on paper and checked against the circuit diagram before any soldering.",
          "Resistors and diodes were soldered first, because they sit lowest on the board.",
          "Transistors, capacitors and the relay were then soldered in place, with the correct polarity checked for each.",
          "Continuity was tested with a multimeter before power was applied.",
          "The transformer and the mains wiring were mounted inside the enclosure, and all mains connections were insulated.",
        ],
      },
      { t: "p", mark: 3, text: "Each step was completed and checked before the next began." },
    ],
    why: {
      headline: "Someone else should be able to repeat what you did.",
      points: [
        { text: "It is written in the past tense, which is how methods are reported.", mark: 1 },
        { text: "The steps are in the order you did them, and each is specific.", mark: 2 },
        { text: "Safety and checking steps are included, not just assembly.", mark: 3 },
      ],
      mistakes: ["Writing in the present tense or as instructions ('Solder the resistors').", "Skipping the safety steps.", "Mixing results into the procedure."],
    },
  },
  {
    id: "testing",
    group: CH5,
    number: "5.2",
    title: "Testing Procedure(s)",
    templateKey: "testing-procedure",
    blocks: [
      {
        t: "p",
        mark: 1,
        text: "Two tests were carried out, one for each part of the design, using a digital multimeter, a 200-litre tank and a stopwatch.",
      },
      {
        t: "list",
        ordered: true,
        mark: 2,
        items: [
          "Power supply test. The regulated output was measured with no load and then with 30 mA, 60 mA and 100 mA loads connected. The output voltage was recorded each time.",
          "Level control test. The tank was emptied and then filled by the controlled pump. The water volume at which the pump switched on and the volume at which it switched off were recorded. This was repeated for ten cycles.",
        ],
      },
    ],
    why: {
      headline: "Say what you tested, with what, and how.",
      points: [
        { text: "It names the equipment, so the results can be trusted.", mark: 1 },
        { text: "Each test lines up with an objective from Section 1.3 (power supply, and level switching).", mark: 2 },
      ],
      mistakes: ["Testing something that isn't an objective.", "Not saying how many times you repeated a test."],
    },
  },
  {
    id: "results",
    group: CH5,
    number: "5.3.1",
    title: "Results of Power Supply and Level Control",
    templateKey: "result-1",
    blocks: [
      {
        t: "table",
        mark: 1,
        caption: "Table 3: Regulated output voltage against load current",
        head: ["Load current (mA)", "Output voltage (V)"],
        rows: [
          ["0", "12.02"],
          ["30", "12.01"],
          ["60", "11.99"],
          ["100", "11.97"],
        ],
      },
      {
        t: "table",
        mark: 2,
        caption: "Table 4: Water volumes at which the pump switched",
        head: ["Cycle", "Pump ON at (litres)", "Pump OFF at (litres)"],
        rows: [
          ["1", "52", "178"],
          ["2", "50", "180"],
          ["3", "51", "179"],
          ["4", "50", "181"],
          ["5", "53", "180"],
          ["6", "51", "179"],
          ["7", "50", "180"],
          ["8", "52", "182"],
          ["9", "51", "180"],
          ["10", "50", "179"],
          ["Mean", "51.0", "179.8"],
        ],
        note: "These measurements are invented for this example. Your results must come from your own tests.",
      },
    ],
    why: {
      headline: "Show the data clearly. Interpret it in the next section.",
      points: [
        { text: "Each table has a number, a title above it and units in the headings.", mark: 1 },
        { text: "Repeated measurements are shown with a mean, so the reader can see both the spread and the average.", mark: 2 },
        { text: "This section only presents results. The explanation comes in the discussion." },
      ],
      mistakes: ["Tables with no units or titles.", "Explaining the results here instead of in the discussion.", "Making up results. Examiners can tell."],
    },
  },
  {
    id: "discussion",
    group: CH5,
    number: "5.4",
    title: "Discussions",
    templateKey: "discussions",
    blocks: [
      {
        t: "p",
        mark: 1,
        text: "Objective (i) required a 12 V, 100 mA supply. Table 3 shows the output fell from 12.02 V at no load to 11.97 V at 100 mA, a change of 0.05 V or about 0.42%. The supply therefore stayed within 12.0 ± 0.1 V and the objective was met.",
      },
      {
        t: "p",
        mark: 2,
        text: "Objectives (ii) and (iv) required the pump to switch at the low and high levels. Table 4 shows that the pump switched on at a mean of 51.0 litres, which is about 25% of the tank, and off at a mean of 179.8 litres, about 90%. It did so in all ten cycles.",
      },
      {
        t: "p",
        mark: 3,
        text: "The switching volumes varied by up to 4 litres between cycles. This is probably because the water surface ripples while the tank fills, so the water touches the probe tips slightly earlier or later. The variation is small and does not affect safe operation, but it shows that probe position matters.",
      },
    ],
    why: {
      headline: "Tie every result back to an objective, honestly.",
      points: [
        { text: "It restates the objective, quotes the evidence from the table and says whether it was met.", mark: 1 },
        { text: "It treats the level-control objectives together, with the numbers that show the result.", mark: 2 },
        { text: "It explains the small variation and says what it means. Unexpected results are noted, not hidden.", mark: 3 },
      ],
      mistakes: ["Repeating the table in words.", "Only reporting results that look good.", "Not saying whether an objective was met."],
    },
  },
  {
    id: "conclusion",
    group: CH6,
    number: "6.1",
    title: "Conclusion",
    templateKey: "conclusion",
    blocks: [
      {
        t: "p",
        mark: 1,
        text: "An automatic water level controller was designed, constructed and tested. The 12 V supply held within 12.0 ± 0.1 V up to 100 mA, the relay driver switched the pump reliably, and in ten fill cycles the pump switched on at a mean of 51.0 litres and off at a mean of 179.8 litres.",
      },
      {
        t: "p",
        mark: 2,
        text: "All four objectives were met. The controller removes the need to switch the pump by hand and so reduces overflow and dry running, at a low cost with locally available parts.",
      },
    ],
    why: {
      headline: "Say how far you got against what you set out to do.",
      points: [
        { text: "It summarises the most important findings with numbers.", mark: 1 },
        { text: "It states the success against the objectives and links back to the problem in Chapter 1.", mark: 2 },
        { text: "It adds nothing new. All the evidence was already in Chapter 5." },
      ],
      mistakes: ["Introducing new results.", "Claiming more than was tested."],
    },
  },
  {
    id: "recommendation",
    group: CH6,
    number: "6.2",
    title: "Recommendation",
    templateKey: "recommendation",
    blocks: [
      {
        t: "list",
        mark: 1,
        items: [
          "Use alternating-current excitation on the probes to reduce corrosion.",
          "Add dry-run protection that switches the pump off if the source is empty.",
          "Add an overload cutout for the pump motor.",
          "Add remote monitoring so the level can be checked from a phone.",
        ],
      },
    ],
    why: {
      headline: "Suggest concrete improvements and further work.",
      points: [
        { text: "Each item links to a limitation seen in the work, for example probe corrosion and the scope in Section 1.5.", mark: 1 },
        { text: "They give the next student something specific to build on." },
      ],
      mistakes: ["Vague advice such as 'improve the design'.", "Recommendations that don't relate to your findings."],
    },
  },
  {
    id: "references",
    group: "Back matter",
    number: "",
    title: "References",
    blocks: [
      {
        t: "list",
        mark: 1,
        items: [
          "[1] A. Author, Water Supply and Storage in Nigerian Buildings, 2nd ed. City: Publisher, 2018.",
          "[2] B. Writer and C. Researcher, “Causes of overflow in domestic pumping systems,” Journal of Water Systems, vol. 12, no. 3, pp. 45-52, Jun. 2019.",
          "[3] D. Engineer, “Cost of commercial level controllers,” in Proc. Conf. Applied Electronics, Kaduna, 2020, pp. 101-105.",
          "[4] E. Author. (2017, Mar. 4). Float-switch pump control [Online]. Available: http://example.org/float",
          "[5] F. Maker, “A 555-based probe level sensor,” Electronics Projects Journal, vol. 4, no. 2, pp. 20-26, Apr. 2016.",
          "[6] G. Builder, “Ultrasonic tank level monitoring,” Sensors Letters, vol. 9, pp. 88-93, Jan. 2021.",
          "[7] H. Designer, “GSM-controlled water pump,” in Proc. Int. Conf. Embedded Systems, Lagos, 2019, pp. 210-214.",
          "[8] I. Student, “CMOS latch level controller,” B.Eng. project, Dept. Elect. Eng., Example Univ., City, 2018.",
        ],
        
      },
      {
        t: "p",
        text: "Every entry above is invented. They show the IEEE format your department uses, and are not real sources. Cite only works you have actually read.",
      },
    ],
    why: {
      headline: "Every number in the text must match an entry here, and the reverse.",
      points: [
        { text: "The list is in the order the sources were first cited, which is how IEEE numbering works.", mark: 1 },
        { text: "Each type of source follows its own format: book, journal article, conference paper, website and thesis. In APA the same sources would be listed alphabetically and cited as (Author, year)." },
      ],
      mistakes: ["Listing sources you never cited in the text.", "Citing a number that's missing from the list.", "Mixing IEEE and APA styles."],
    },
  },
];

export const exampleGroups = Array.from(new Set(exampleParts.map((part) => part.group)));

export const findExamplePart = (id: string) => exampleParts.find((part) => part.id === id);

/** The example part that matches a template section or front-matter page, if there is one. */
export function exampleFor(match: { templateKey?: string | null; documentType?: string | null }) {
  if (match.templateKey) return exampleParts.find((part) => part.templateKey === match.templateKey);
  if (match.documentType) return exampleParts.find((part) => part.documentType === match.documentType);
}
