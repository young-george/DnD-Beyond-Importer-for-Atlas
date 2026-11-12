Array.prototype.sum = function <T>(
    this: T[],
    predicate?: (value: T) => number | undefined
): number {
    if (predicate) {
        return this.reduce((acc, item) => acc + (predicate(item) ?? 0), 0);
    }
    return (this as unknown as number[]).reduce((acc, item) => acc + item, 0);
};

Array.prototype.deduplicate = function <T>(this: T[], predicate: (value: T) => unknown): T[] {
    return [...new Map(this.map(item => [predicate(item), item])).values()];
}
