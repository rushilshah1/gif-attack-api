export interface IRound {
  roundNumber?: number;
  roundActive?: boolean;
}

export interface IClock {
  gameId: string;
  minutes: number;
  seconds: number;
}
