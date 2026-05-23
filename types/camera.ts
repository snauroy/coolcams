export type Category = 'compact' | 'rangefinder' | 'slr' | 'medium-format' | 'toy';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Lens {
  focal: number;
  aperture: number;
  maker: string;
  model?: string;
}

export interface Specs {
  shutter: string;
  metering: string;
  focus: string;
  filmSpeeds: string;
}

export interface Camera {
  id: string;
  name: string;
  brand: string;
  category: Category;
  format: string;
  years: string;
  lens: Lens | null;
  specs: Specs;
  vibe: string;
  bestFor: string[];
  culturalNote: string;
  marketPrice: string;
  difficulty: Difficulty;
  wikiImage: string;
}
