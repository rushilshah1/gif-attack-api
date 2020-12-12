export interface IRound {
  roundNumber?: number;
  roundActive?: boolean;
  submissionActive?: boolean;
}

export interface IClock {
  gameId: string;
  minutes: number;
  seconds: number;
}
