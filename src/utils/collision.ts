import { CATCH_Y_TOLERANCE } from '../config/constants';

interface CatchCheck {
  eggX: number;
  eggY: number;
  basketX: number;
  basketTopY: number;
  basketHalfWidth: number;
}

export function isEggCaught({ eggX, eggY, basketX, basketTopY, basketHalfWidth }: CatchCheck): boolean {
  const withinCatchBand = eggY <= basketTopY && eggY > basketTopY - CATCH_Y_TOLERANCE;
  const withinReach = Math.abs(eggX - basketX) <= basketHalfWidth;
  return withinCatchBand && withinReach;
}
