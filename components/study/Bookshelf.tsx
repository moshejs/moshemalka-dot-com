import { useMemo, type JSX } from "react";
import Book, { type BookData, type PullInfo } from "./Book";
import { BookStack, Bookend, Candle, DeskGlobe, Hourglass, Plant } from "./Decor";
import { darkWalnut, walnut } from "./materials";
import { getLabelTexture } from "./spineTexture";

export const ROW_HEIGHT = 0.78; // plank-top to plank-top; tallest book ~0.65 + headroom
export const FIRST_ROW_Y = 0.3; // plank top of the bottom row (above the plinth)
export const ROWS_PER_CASE = 4;
export const UPRIGHT = 0.06; // bay divider thickness
export const INSET = 0.04; // gap between an upright and the first spine
const PLANK = 0.05;
const DEPTH = 0.55; // shelf interior depth (z)
const SIDE = 0.09;

export type Slot = { row: number; bay: number; books: BookData[]; label?: string };

export function bayWidth(innerWidth: number, bays: number) {
  return (innerWidth - (bays - 1) * UPRIGHT) / bays;
}

/**
 * A freestanding walnut bookcase built in local space: spines face local +z,
 * the back panel sits at local −z. Books pull out along local +z, so the
 * gesture works on any wall.
 */
export default function Bookshelf({
  position,
  rotationY = 0,
  innerWidth,
  bays,
  slots,
  pulledId,
  onBookClick,
  onBookHover,
  registerPose,
  candles = true,
}: {
  position: [number, number, number];
  rotationY?: number;
  innerWidth: number;
  bays: number;
  slots: Slot[];
  pulledId: string | null;
  onBookClick: (id: string) => void;
  onBookHover: (id: string | null) => void;
  registerPose: (id: string, pose: () => PullInfo) => void;
  candles?: boolean;
}) {
  const bw = bayWidth(innerWidth, bays);
  const W = innerWidth + SIDE * 2;
  const H = FIRST_ROW_Y + ROW_HEIGHT * ROWS_PER_CASE + 0.02;
  const bayLeft = (b: number) => -innerWidth / 2 + b * (bw + UPRIGHT);

  // Book x positions per slot, plus whatever space is left at the bay's end.
  const filled = useMemo(() => {
    const map = new Map<string, { books: { book: BookData; x: number }[]; end: number }>();
    for (const s of slots) {
      let x = bayLeft(s.bay) + INSET;
      const books = s.books.map((b) => {
        const out = { book: b, x: x + b.thickness / 2 };
        x += b.thickness;
        return out;
      });
      map.set(`${s.row}:${s.bay}`, { books, end: x });
    }
    return map;
  }, [slots, innerWidth, bays]); // eslint-disable-line react-hooks/exhaustive-deps

  // Décor for empty or part-empty bays: a curated sequence with per-object
  // budgets, so no shelf repeats like wallpaper. Stacks are the filler.
  const budget = { plant: 2, candle: candles ? 2 : 0, globe: 1, hourglass: 2 };
  const take = (k: keyof typeof budget) => (budget[k] > 0 ? (budget[k]--, true) : false);
  const SEQUENCE = ["stackCandle", "plant", "globe", "hourglassStack", "tallStack", "stackCandle", "plantStack", "leaningStack"] as const;
  let seq = 0;
  const decor: JSX.Element[] = [];
  for (const row of [1, 2, 0, 3]) {
    const y = FIRST_ROW_Y + row * ROW_HEIGHT;
    for (let bay = 0; bay < bays; bay++) {
      const left = bayLeft(bay);
      const right = left + bw;
      const slot = filled.get(`${row}:${bay}`);
      const key = `${row}-${bay}`;
      const z = 0.02;
      if (slot && slot.books.length) {
        const free = right - slot.end;
        if (free > 0.06) decor.push(<Bookend key={`be${key}`} position={[slot.end + 0.008, y, z]} />);
        if (free > 0.62) {
          const cx = (slot.end + right) / 2 + 0.05;
          if (take("hourglass")) decor.push(<Hourglass key={`h${key}`} position={[cx, y, z]} />);
          else decor.push(<BookStack key={`s${key}`} position={[cx, y, z]} seed={row * 5 + bay} count={2} />);
        }
        continue;
      }
      const cx = (left + right) / 2;
      const kind = SEQUENCE[seq++ % SEQUENCE.length];
      const stack = (dx: number, count: number) => (
        <BookStack key={`s${key}${dx}`} position={[cx + bw * dx, y, z]} seed={row * 7 + bay * 3 + count} count={count} />
      );
      if (kind === "stackCandle") {
        decor.push(stack(-0.16, 3));
        if (take("candle")) decor.push(<Candle key={`c${key}`} position={[cx + bw * 0.27, y, z + 0.04]} />);
      } else if (kind === "plant" && take("plant")) {
        decor.push(<Plant key={`p${key}`} position={[cx + bw * 0.05, y, z]} seed={row * 11 + bay} />);
      } else if (kind === "plantStack" && take("plant")) {
        decor.push(<Plant key={`p${key}`} position={[cx - bw * 0.24, y, z]} seed={row * 13 + bay} />);
        decor.push(stack(0.16, 2));
      } else if (kind === "globe" && take("globe")) {
        decor.push(<DeskGlobe key={`g${key}`} position={[cx - bw * 0.12, y, z]} />);
        decor.push(<Bookend key={`be${key}`} position={[cx + bw * 0.32, y, z]} />);
      } else if (kind === "hourglassStack" && take("hourglass")) {
        decor.push(<Hourglass key={`h${key}`} position={[cx - bw * 0.26, y, z]} />);
        decor.push(stack(0.12, 4));
      } else if (kind === "tallStack") {
        decor.push(stack(-0.05, 5));
      } else {
        // budget spent: a couple of quiet stacks, offset so neighbours differ
        decor.push(stack(-0.22, 2 + (bay % 2)));
        decor.push(stack(0.2, 3 - (bay % 2)));
      }
    }
  }

  const wood = walnut();
  const dark = darkWalnut();

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* back panel, slightly recessed and darker so the books read against it */}
      <mesh material={dark} receiveShadow position={[0, H / 2, -DEPTH / 2 - 0.012]}>
        <boxGeometry args={[W, H, 0.024]} />
      </mesh>
      {/* carcass sides */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={wood} castShadow receiveShadow position={[s * (W / 2 - SIDE / 2), H / 2, 0.01]}>
          <boxGeometry args={[SIDE, H, DEPTH + 0.04]} />
        </mesh>
      ))}
      {/* plinth: recessed kick + base moulding */}
      <mesh material={dark} receiveShadow position={[0, 0.06, 0.0]}>
        <boxGeometry args={[W - 0.04, 0.12, DEPTH]} />
      </mesh>
      <mesh material={wood} castShadow receiveShadow position={[0, 0.14, 0.03]}>
        <boxGeometry args={[W + 0.04, 0.05, DEPTH + 0.08]} />
      </mesh>
      {/* crown: stepped cornice that overhangs the case */}
      <mesh material={wood} castShadow receiveShadow position={[0, H + 0.03, 0.02]}>
        <boxGeometry args={[W + 0.08, 0.06, DEPTH + 0.1]} />
      </mesh>
      <mesh material={wood} castShadow receiveShadow position={[0, H + 0.09, 0.04]}>
        <boxGeometry args={[W + 0.18, 0.07, DEPTH + 0.18]} />
      </mesh>
      <mesh material={dark} castShadow position={[0, H + 0.145, 0.05]}>
        <boxGeometry args={[W + 0.22, 0.04, DEPTH + 0.22]} />
      </mesh>

      {/* bay uprights */}
      {Array.from({ length: bays - 1 }, (_, i) => {
        const x = bayLeft(i + 1) - UPRIGHT / 2;
        return (
          <mesh key={i} material={wood} castShadow receiveShadow position={[x, H / 2, 0.005]}>
            <boxGeometry args={[UPRIGHT, H, DEPTH + 0.02]} />
          </mesh>
        );
      })}

      {/* shelves with a lipped front edge */}
      {Array.from({ length: ROWS_PER_CASE }, (_, i) => {
        const y = FIRST_ROW_Y + i * ROW_HEIGHT;
        return (
          <group key={i}>
            <mesh material={wood} castShadow receiveShadow position={[0, y - PLANK / 2, 0]}>
              <boxGeometry args={[innerWidth, PLANK, DEPTH]} />
            </mesh>
            <mesh material={dark} castShadow position={[0, y - PLANK / 2 - 0.004, DEPTH / 2 + 0.008]}>
              <boxGeometry args={[innerWidth, PLANK + 0.018, 0.016]} />
            </mesh>
          </group>
        );
      })}

      {/* books */}
      {slots.map((s) =>
        (filled.get(`${s.row}:${s.bay}`)?.books ?? []).map(({ book, x }) => {
          const y = FIRST_ROW_Y + s.row * ROW_HEIGHT;
          // spines sit a touch proud of centre, like a real shelf
          return (
            <Book
              key={book.id}
              data={book}
              position={[x, y + book.height / 2, DEPTH / 2 - book.depth / 2 - 0.02]}
              pulled={pulledId === book.id}
              onClick={onBookClick}
              onHover={onBookHover}
              register={registerPose}
            />
          );
        })
      )}

      {/* engraved brass plates where each subject begins */}
      {slots
        .filter((s) => s.label)
        .map((s) => {
          const y = FIRST_ROW_Y + s.row * ROW_HEIGHT - PLANK / 2 - 0.004;
          return (
            <mesh key={`label-${s.label}`} position={[bayLeft(s.bay) + bw / 2, y, DEPTH / 2 + 0.0185]}>
              <planeGeometry args={[0.5, 0.05]} />
              {/* Low metalness + a faint self-glow: pure metal only mirrors the dim room and reads black. */}
              <meshStandardMaterial
                map={getLabelTexture(s.label!)}
                emissiveMap={getLabelTexture(s.label!)}
                emissive="#ffffff"
                emissiveIntensity={0.32}
                metalness={0.35}
                roughness={0.42}
              />
            </mesh>
          );
        })}

      {decor}
    </group>
  );
}
