interface RumDash {
    init: (config: { key: string; env: string; revision?: string }) => void;
}

declare var RumDash: RumDash;
