import * as THREE from "three";
import { useMemo } from "react";
import Book, { type BookData } from "./Book";

export type ShelfRow = {
  id: number;
  label: string;
  y: number; // y of the plank's TOP surface — books sit on it
  books: BookData[];
};

const SHELF_INNER_WIDTH = 6.4;
const SHELF_THICKNESS = 0.06;
const SIDE_THICKNESS = 0.1;
const SHELF_DEPTH = 0.55; // depth (z) of the shelf interior

export default function Bookshelf({
  position,
  totalHeight,
  rows,
  pulledId,
  onBookClick,
}: {
  position: [number, number, number];
  totalHeight: number;
  rows: ShelfRow[];
  pulledId: number | null;
  onBookClick: (id: number, mesh: THREE.Mesh) => void;
}) {
  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a2515",
        roughness: 0.7,
        metalness: 0,
      }),
    []
  );

  const W = SHELF_INNER_WIDTH + SIDE_THICKNESS * 2;
  const D = SHELF_DEPTH;

  // pre-compute book layouts per row
  const layouts = useMemo(() => {
    return rows.map((row) => {
      const total = row.books.reduce((s, b) => s + b.thickness, 0);
      const startX =
        position[0] - SHELF_INNER_WIDTH / 2 + (SHELF_INNER_WIDTH - total) / 2;
      let cursor = startX;
      return row.books.map((b) => {
        const x = cursor + b.thickness / 2;
        cursor += b.thickness;
        return { book: b, x };
      });
    });
  }, [rows, position]);

  return (
    <group>
      {/* outer frame: back, sides, top, bottom */}
      <mesh
        position={[
          position[0],
          position[1] + totalHeight / 2,
          position[2] - D / 2 - 0.01,
        ]}
        material={woodMat}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[W, totalHeight, 0.04]} />
      </mesh>
      <mesh
        position={[
          position[0] - W / 2 + SIDE_THICKNESS / 2,
          position[1] + totalHeight / 2,
          position[2],
        ]}
        material={woodMat}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[SIDE_THICKNESS, totalHeight, D]} />
      </mesh>
      <mesh
        position={[
          position[0] + W / 2 - SIDE_THICKNESS / 2,
          position[1] + totalHeight / 2,
          position[2],
        ]}
        material={woodMat}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[SIDE_THICKNESS, totalHeight, D]} />
      </mesh>
      <mesh
        position={[
          position[0],
          position[1] + totalHeight - SHELF_THICKNESS / 2,
          position[2],
        ]}
        material={woodMat}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[W, SHELF_THICKNESS, D]} />
      </mesh>

      {/* shelf planks under each row + books seated on top */}
      {rows.map((row, i) => (
        <group key={row.id}>
          <mesh
            position={[
              position[0],
              position[1] + row.y - SHELF_THICKNESS / 2,
              position[2],
            ]}
            material={woodMat}
            receiveShadow
            castShadow
          >
            <boxGeometry args={[SHELF_INNER_WIDTH, SHELF_THICKNESS, D]} />
          </mesh>
          {layouts[i].map(({ book, x }) => (
            <Book
              key={book.id}
              data={book}
              position={[x, position[1] + row.y + book.height / 2, position[2]]}
              pulled={pulledId === book.id}
              onClick={onBookClick}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
