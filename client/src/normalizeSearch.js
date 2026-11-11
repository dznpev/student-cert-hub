export function normalizeSearch(value) {
  return value.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd')
}
