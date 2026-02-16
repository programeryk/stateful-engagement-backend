-- Enforce core domain invariants at the database layer.
ALTER TABLE "UserState"
  ADD CONSTRAINT "UserState_level_check" CHECK ("level" >= 1),
  ADD CONSTRAINT "UserState_energy_check" CHECK ("energy" >= 0 AND "energy" <= 100),
  ADD CONSTRAINT "UserState_fatigue_check" CHECK ("fatigue" >= 0 AND "fatigue" <= 100),
  ADD CONSTRAINT "UserState_loyalty_check" CHECK ("loyalty" >= 0),
  ADD CONSTRAINT "UserState_streak_check" CHECK ("streak" >= 0);

ALTER TABLE "UserTool"
  ADD CONSTRAINT "UserTool_quantity_check" CHECK ("quantity" >= 0);

ALTER TABLE "ToolDefinition"
  ADD CONSTRAINT "ToolDefinition_price_check" CHECK ("price" >= 0);

ALTER TABLE "Reward"
  ADD CONSTRAINT "Reward_threshold_check" CHECK ("threshold" > 0);
