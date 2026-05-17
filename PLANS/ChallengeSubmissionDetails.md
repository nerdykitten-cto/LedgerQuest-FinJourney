Challenge 4: The Mobile App Alchemy: Agentic Game Quest (Genre-Agnostic: Hyper-Casual / RPG / Puzzle / Strategy/ Single/ Multiplayer)

CHALLENGE OVERVIEW

Mobile gaming is evolving beyond static levels and predictable mechanics. This challenge asks teams to build a mobile game in any genre - hyper-casual, puzzle, RPG, strategy, simulation, multiplayer, or hybrid - where Google Antigravity drives intelligent game behavior. The game must show that agentic AI improves gameplay by adapting difficulty, generating content, learning from player behavior, coordinating NPCs/opponents, and optimizing engagement.

PROBLEM STATEMENT

    Build a working mobile game with a clear core loop: player action -> feedback -> reward -> progression.
    Use Google Antigravity to drive agentic gameplay decisions, not merely decorative AI responses.
    Show how the agent observes player behavior, infers skill or strategy, decides changes, executes game adaptations, and evaluates outcome.
    Implement adaptive difficulty using multiple player-performance and engagement signals.
    Include agent traces that explain why a level, NPC behavior, reward, hint, or challenge was generated.
    Compare the agentic version against a non-agentic baseline or fixed-rule version.

MANDATORY REQUIREMENT: GOOGLE ANTIGRAVITY

    Use Google Antigravity as the primary orchestrator for gameplay logic, NPC/opponent reasoning, procedural content generation, difficulty adaptation, rewards, validation, or narrative decisions.
    Antigravity must manage structured agent workflows and state decisions such as skill assessment, level generation, fairness validation, and reward logic. 
    Teams must show Antigravity decision traces: what was observed, inferred, decided, executed, and measured.

WHAT COUNTS AS AGENTIC?

1. Not Sufficient

    Fixed rule: if score > 1000, set difficulty to hard.
    Preloaded level_7.json is selected from a fixed library.
    NPC attacks when player is near.
    Random rewards or fixed loot table.

2. Expected Agentic Behavior

    Agent observes score, timing, accuracy, retry behavior, session trend, and strategy pattern; infers skill and boredom/frustration risk; generates a difficulty adjustment with explanation.
    Agent generates a new level configuration for target difficulty, checks solvability/fairness, rejects poor configurations, and stores reasoning trace.
    NPC observes the player’s dominant strategy, predicts next move, changes tactics, and adapts again if the player counters.
    Reward agent evaluates effort, progress, retention risk, and fairness before assigning a reward or challenge.

SYSTEM REQUIREMENTS

    Core loop engine: Game must have a polished, playable, repeatable loop with smooth feedback, scoring, rewards, and progression.
    Adaptive difficulty: Use at least five factors such as completion time, accuracy, resource efficiency, retry count, win/loss ratio, session length, quit behavior, learning speed, or strategy consistency.
    Intelligent NPC/opponent behavior: NPCs or opponents should observe, reason, adapt, and remember patterns. If genre has no NPCs, use an equivalent challenge-generation or puzzle-master agent.
    Procedural content generation: Agent generates levels, quests, puzzles, encounters, or missions; validates solvability, fairness, target difficulty, and novelty.
    Quality-control agent: Validate generated content to avoid impossible, trivial, unfair, or broken levels. Show acceptance/rejection logs.
    Retention and engagement metrics: Track session length, retries, churn risk, difficulty spike abandonment, challenge acceptance, feature exploration, and satisfaction proxy.
    Fair play/referee logic: Agent checks rule compliance, scoring validity, reward fairness, anti-exploit behavior, and multiplayer fairness where applicable.
    Comparative baseline: Show agentic vs fixed-rule gameplay comparison using engagement, win rate, retry rate, or player satisfaction proxy.
    Optional multimodal innovation: Camera, microphone, location, or multiplayer features may be used if privacy-preserving and relevant to gameplay.
    Privacy and safety: Do not store raw personal images/audio/location. Use on-device processing, anonymized signals, or explicit mock data where needed.

EXAMPLE SCENARIO

A puzzle/adventure game tracks that the player completes Level 5 in 45 seconds against a 60-second par time with 98% accuracy and two sessions of steady improvement. The agent infers that the player may become bored if difficulty remains unchanged.

    Observation: Fast completion, high accuracy, low retry count, increasing session length.
    Inference: Player is advanced; current puzzle family is too easy.
    Decision: Increase difficulty by 1.3x and introduce one new mechanic while keeping expected win rate around 50-60%.
    Action: Generate new level with additional obstacle pattern, validate solvability, and adjust reward.
    Evaluation: Track whether the next attempt creates a close-call moment without causing frustration.

RECOMMENDED STRESS-TEST SCENARIOS

    Player repeatedly fails and the agent must reduce frustration without making the game boring.
    Player discovers an exploit or dominant strategy; NPC or level agent must counter it fairly.
    Generated level is impossible and quality-control agent must reject and regenerate it.
    Agentic version must demonstrate better engagement or balanced difficulty than fixed-rule baseline.
    Multiplayer matchmaking must avoid unfair pairings or repeated mismatches if multiplayer is implemented.

DELIVERABLES

    Working mobile game prototype.
    Demo video of around 3 minutes focusing on gameplay and showing how Antigravity makes the experience adaptive, intelligent, and replayable.
    Architecture map showing Antigravity workflows, agent roles, state management, player metrics, and tool/data flow.
    Agent trace/logs showing observation, inference, decision, action, and outcome evaluation.
    README explaining the game hook, baseline comparison, engagement metrics, content-generation logic, privacy approach, and limitations.

EVALUATION CRITERIA

    Antigravity integration 25%
    Gameplay engagement and retention 25%
    Agentic innovation 20%
    Technical polish 15%
    Originality and creativity 10%
    Comparative proof bonus +5%
