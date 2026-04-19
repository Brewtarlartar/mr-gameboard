export interface TeachChapter {
  heading: string;
  body: string;
}

export interface TeachPlan {
  title: string;
  chapters: TeachChapter[];
}

export interface TeachPlayer {
  name: string;
  faction?: string;
}
