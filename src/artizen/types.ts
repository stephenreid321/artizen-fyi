export type Row = Record<string, unknown>;

export type Constraint = { key: string; constraint_type: string; value?: unknown };

export type BubbleResponse = {
  results?: Row[];
  remaining?: number;
};

export type DriveStat = {
  sales: number;
  venus: number;
  match: number;
  prize?: number;
  sprint?: number;
  raised: number;
  available?: number;
};

export type Season = {
  id: string;
  number: number;
  title: string;
  tag: unknown;
  current: boolean;
  total_raised?: number;
  competition_start: unknown;
  competition_end: unknown;
};

export type PodiumRow = {
  name: string;
  url: string;
  sales_match: number;
  points: number;
  score: number;
};

export type Drive = {
  id: string;
  name: string;
  url: string;
  season_id: unknown;
  season_number?: number | null;
  season?: string | null;
  image?: string | null;
  description?: string | null;
  status: unknown;
  active: boolean;
  number?: number | null;
  start: unknown;
  end: unknown;
  multiple?: number | null;
  match_pot?: number | null;
  prize_projects?: number | null;
  prize_funds?: number | null;
  match_per_project?: number | null;
  project_first?: number | null;
  project_second?: number | null;
  project_third?: number | null;
  fund_first?: number | null;
  fund_second?: number | null;
  fund_third?: number | null;
  podium?: PodiumRow[];
  fund_podium?: PodiumRow[];
};

export type ProjectRow = {
  name: string;
  url: string;
  creator?: string;
  logline?: string;
  sales: number;
  venus: number;
  match: number;
  prize: number;
  sprint?: number;
  raised: number;
};

export type FundRow = {
  name: string;
  subtitle?: string;
  url: string;
  season_total: number;
  last_contribution: unknown;
  created_at?: unknown;
  active: unknown;
  unlocked?: number;
  available?: number;
  raised?: number;
};

export type DetailPreview = {
  name: string;
  lead?: string;
  created_at?: unknown;
};

export type Leaderboard = {
  seasons: Season[];
  season: Season | null;
  drives: Drive[];
  projects: ProjectRow[];
  funds: FundRow[];
  error: boolean;
};

export type MatchingFund = {
  name: string;
  url: string;
  drive?: string | null;
  drive_active?: boolean | null;
  drive_number?: number | null;
  drive_multiple?: number | null;
  season?: string | null;
  season_number?: number | null;
  available: number;
  unlocked: number;
  cap: number;
};

export type ProjectDriveDetail = DriveStat & {
  name: string;
  status: unknown;
  active?: boolean | null;
  number?: number | null;
  url?: string | null;
  multiple?: number | null;
  season?: string | null;
  season_id: unknown;
  season_number?: number | null;
  funds?: MatchingFund[];
};

export type ProjectFundingSeason = {
  number?: number | null;
  title: string;
  sales: number;
  venus: number;
  match: number;
  prize: number;
  sprint?: number;
  raised: number;
  available?: number;
  drives?: ProjectDriveDetail[];
};

export type ProjectSubmission = {
  name: string;
  url: string;
  status?: string;
  season?: string | null;
  season_number?: number | null;
  created_at: unknown;
};

export type SuggestedFund = {
  name: string;
  url: string;
  subtitle?: string;
  available?: number;
  sharedProjects: number;
  connectingFund: string;
};

export type ProjectPage = {
  name: string;
  artizen_url: string;
  creator?: string;
  logline?: string;
  image?: string | null;
  tags: string[];
  seasons: ProjectFundingSeason[];
  submissions: ProjectSubmission[];
  suggestedFunds?: SuggestedFund[];
};

export type FundMatchedProject = {
  name: string;
  url: string;
  creator?: string | null;
  hidden?: unknown;
  drive?: string | null;
  drive_url?: string | null;
  drive_active?: boolean | null;
  drive_number?: number | null;
  drive_multiple?: number | null;
  season?: string | null;
  season_number?: number | null;
  available: number;
  unlocked: number;
};

export type FundDriveNest = {
  name: string;
  url?: string | null;
  active?: boolean | null;
  adjustment?: boolean;
  number?: number | null;
  multiple?: number | null;
  unlocked: number;
  available: number;
  projects: FundMatchedProject[];
};

export type FundFundingSeason = {
  number?: number | null;
  title: string;
  total: number;
  count: number;
  unlocked?: number;
  available?: number;
  drives?: FundDriveNest[];
};

export type FundPage = {
  name: string;
  artizen_url: string;
  image?: string | null;
  subtitle?: string;
  for_title?: string;
  sponsor?: string;
  created_at?: unknown;
  available: number;
  unlocked: number;
  prize_art?: number;
  prize_usd?: number;
  active: unknown;
  contrib_total: number;
  seasons: FundFundingSeason[];
};

export type BoostHolder = {
  rank: number;
  name: string;
  image?: string | null;
  points: number;
  share: number;
  cumulative: number;
  admin: boolean;
};

export type BoostBucket = {
  label: string;
  users: number;
  points: number;
};

export type BoostsPage = {
  remaining: number;
  accounts: number;
  holders: number;
  zero: number;
  mean: number;
  median: number;
  admin: number;
  community: number;
  top_points: number;
  top_share: number;
  updated_at: string;
  buckets: BoostBucket[];
  top: BoostHolder[];
  error: boolean;
};
