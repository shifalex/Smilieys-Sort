export function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

export function triadKey(first, second, whole) {
  return `${Math.min(first, second)}-${Math.max(first, second)}-${whole}`;
}
