import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf-8')

describe('shell mới', () => {
  it('sidebar hỗ trợ nhóm mục', () => {
    const src = read('components/AppSidebar.jsx')
    expect(src).toContain('group')
    expect(src).toContain('items')
  })

  it('sidebar có gạch trái cho mục đang chọn', () => {
    expect(read('tokens/components.css')).toMatch(/portal-nav__item--active[\s\S]*::before/)
  })

  it('topbar chỉ hiện ô tìm kiếm khi có search', () => {
    const src = read('components/AppTopbar.jsx')
    expect(src).toContain('search !== null')
    expect(src).toContain('searchPlaceholder')
  })

  it('shell có 3 hàng: topbar, nội dung, footer', () => {
    expect(read('tokens/components.css')).toMatch(/grid-template-rows:\s*auto 1fr auto/)
  })

  it('sidebar rộng 238px', () => {
    expect(read('tokens/components.css')).toContain('238px')
  })
})
